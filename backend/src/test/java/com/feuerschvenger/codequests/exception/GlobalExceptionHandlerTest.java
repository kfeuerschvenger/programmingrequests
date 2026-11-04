package com.feuerschvenger.codequests.exception;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.feuerschvenger.codequests.config.I18nConfig;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.beans.TypeMismatchException;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.context.support.DefaultMessageSourceResolvable;
import org.springframework.context.support.StaticMessageSource;
import org.springframework.core.MethodParameter;
import org.springframework.dao.CannotAcquireLockException;
import org.springframework.dao.ConcurrencyFailureException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.validation.method.ParameterValidationResult;

import java.sql.SQLException;
import java.util.List;
import java.util.Locale;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@DisplayName("GlobalExceptionHandler")
class GlobalExceptionHandlerTest {

    private static final String VOTE_DUPLICATE = "Duplicate entry 'secret-marker' for key 'votes.uq_votes_idea_voter'";

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler(new I18nConfig().messageSource());
    private final ServletWebRequest request = new ServletWebRequest(new MockHttpServletRequest("PUT", "/api/ideas/1/vote"));

    @BeforeEach
    void useEnglish() {
        LocaleContextHolder.setLocale(Locale.ENGLISH);
    }

    @AfterEach
    void resetLocale() {
        LocaleContextHolder.resetLocaleContext();
    }

    private static ProblemDetail problem(ResponseEntity<Object> response) {
        assertThat(response.getBody()).isInstanceOf(ProblemDetail.class);
        return (ProblemDetail) response.getBody();
    }

    @SuppressWarnings("unchecked")
    private static List<FieldIssue> errors(ResponseEntity<Object> response) {
        return (List<FieldIssue>) problem(response).getProperties().get(GlobalExceptionHandler.ERRORS_PROPERTY);
    }

    private static String code(ResponseEntity<Object> response) {
        return String.valueOf(problem(response).getProperties().get(GlobalExceptionHandler.CODE_PROPERTY));
    }

    @Nested
    @DisplayName("conflicts")
    class Conflicts {

        @Test
        @DisplayName("maps concurrency failures, including lock failures, to 409 CONFLICT")
        void concurrencyFailures() {
            for (ConcurrencyFailureException ex : List.of(
                    new ConcurrencyFailureException("x"),
                    new PessimisticLockingFailureException("x"),
                    new CannotAcquireLockException("x"),
                    new OptimisticLockingFailureException("x"))) {
                var response = handler.handleConcurrencyFailure(ex, request);

                assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
                assertThat(code(response)).isEqualTo("CONFLICT");
            }
        }

        @Test
        @DisplayName("maps a unique violation on a voter and an idea to 409 CONFLICT without echoing the key")
        void voteUniqueViolation() {
            var ex = new DataIntegrityViolationException("could not execute statement",
                    new SQLException(VOTE_DUPLICATE, "23000", 1062));

            var response = handler.handleDataIntegrity(ex, request);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
            assertThat(code(response)).isEqualTo("CONFLICT");
            assertThat(String.valueOf(problem(response))).doesNotContain("secret-marker");
        }

        @Test
        @DisplayName("maps any other integrity violation to 500 INTERNAL_ERROR")
        void otherIntegrityViolation() {
            var duplicateElsewhere = new DataIntegrityViolationException("x",
                    new SQLException("Duplicate entry 'secret-marker' for key 'ideas.other_key'", "23000", 1062));
            var notNull = new DataIntegrityViolationException("x",
                    new SQLException("Column 'voter_hash' cannot be null", "23000", 1048));
            var noCause = new DataIntegrityViolationException("Duplicate entry for key 'votes.uq_votes_idea_voter'");
            var wrongState = new DataIntegrityViolationException("x", new SQLException(VOTE_DUPLICATE, "HY000", 1062));

            for (var ex : List.of(duplicateElsewhere, notNull, noCause, wrongState)) {
                var response = handler.handleDataIntegrity(ex, request);

                assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
                assertThat(code(response)).isEqualTo("INTERNAL_ERROR");
                assertThat(String.valueOf(problem(response))).doesNotContain("secret-marker");
            }
        }
    }

    @Nested
    @DisplayName("field messages")
    class FieldMessages {

        private GlobalExceptionHandler withBundle(StaticMessageSource source) {
            source.addMessage("error.validation", Locale.ENGLISH, "The request is not valid.");
            return new GlobalExceptionHandler(source);
        }

        @Test
        @DisplayName("uses the general field key for a type mismatch that has no field name")
        void typeMismatchWithoutName() {
            var source = new StaticMessageSource();
            source.addMessage("validation.request.typeMismatch", Locale.ENGLISH, "general text");
            source.addMessage("validation.null.typeMismatch", Locale.ENGLISH, "null-keyed text");
            source.addMessage("validation.typeMismatch", Locale.ENGLISH, "constraint text");

            var response = withBundle(source).handleTypeMismatch(new TypeMismatchException("v", String.class), new HttpHeaders(),
                    HttpStatus.BAD_REQUEST, request);

            var errors = errors(response);
            assertThat(errors).containsExactly(new FieldIssue("request", "general text"));
        }

        @Test
        @DisplayName("keeps the field name for a type mismatch that has one")
        void typeMismatchWithName() {
            var source = new StaticMessageSource();
            source.addMessage("validation.size.typeMismatch", Locale.ENGLISH, "size text");
            source.addMessage("validation.request.typeMismatch", Locale.ENGLISH, "general text");
            var mismatch = new MethodArgumentTypeMismatchException("many", Integer.class, "size", mock(MethodParameter.class), null);

            var response = withBundle(source).handleTypeMismatch(mismatch, new HttpHeaders(), HttpStatus.BAD_REQUEST, request);

            var errors = errors(response);
            assertThat(errors).containsExactly(new FieldIssue("size", "size text"));
        }

        @Test
        @DisplayName("uses the general field key for a validated parameter that has no name")
        void handlerMethodValidationWithoutName() {
            var source = new StaticMessageSource();
            source.addMessage("validation.request.Min", Locale.ENGLISH, "general text");
            source.addMessage("validation.null.Min", Locale.ENGLISH, "null-keyed text");
            source.addMessage("validation.Min", Locale.ENGLISH, "constraint text");
            var parameter = mock(MethodParameter.class);
            when(parameter.getParameterName()).thenReturn(null);
            var result = mock(ParameterValidationResult.class);
            when(result.getMethodParameter()).thenReturn(parameter);
            when(result.getResolvableErrors()).thenReturn(List.of(new DefaultMessageSourceResolvable(new String[]{"Min"})));
            var ex = mock(HandlerMethodValidationException.class);
            when(ex.getParameterValidationResults()).thenReturn(List.of(result));

            var response = withBundle(source).handleHandlerMethodValidationException(ex, new HttpHeaders(), HttpStatus.BAD_REQUEST, request);

            var errors = errors(response);
            assertThat(errors).containsExactly(new FieldIssue("request", "general text"));
        }
    }

    @Nested
    @DisplayName("logging")
    class Logging {

        private final Logger logger = (Logger) LoggerFactory.getLogger(GlobalExceptionHandler.class);
        private final ListAppender<ILoggingEvent> appender = new ListAppender<>();
        private Level originalLevel;

        @BeforeEach
        void attach() {
            originalLevel = logger.getLevel();
            logger.setLevel(Level.DEBUG);
            appender.start();
            logger.addAppender(appender);
        }

        @AfterEach
        void detach() {
            logger.detachAppender(appender);
            logger.setLevel(originalLevel);
        }

        @Test
        @DisplayName("logs a handled 4xx at DEBUG with the status and exception type only")
        void clientErrorAtDebug() {
            handler.handleIdeaNotFound(new IdeaNotFoundException(), request);

            assertThat(appender.list).hasSize(1);
            var event = appender.list.getFirst();
            assertThat(event.getLevel()).isEqualTo(Level.DEBUG);
            assertThat(event.getFormattedMessage()).contains("404").contains("IdeaNotFoundException");
        }

        @Test
        @DisplayName("logs a 5xx once at ERROR with the origin and the cause chain, never the exception message")
        void serverErrorAtError() {
            var ex = new DataIntegrityViolationException("password=hunter2", new SQLException("secret-marker", "23000", 1048));

            handler.handleDataIntegrity(ex, request);

            assertThat(appender.list).hasSize(1);
            var event = appender.list.getFirst();
            assertThat(event.getLevel()).isEqualTo(Level.ERROR);
            assertThat(event.getFormattedMessage())
                    .contains("500")
                    .contains("serverErrorAtError")
                    .contains("DataIntegrityViolationException")
                    .contains("java.sql.SQLException")
                    .doesNotContain("hunter2")
                    .doesNotContain("secret-marker");
        }

        @Test
        @DisplayName("logs an unexpected exception once at ERROR")
        void unexpectedAtError() {
            handler.handleUnexpected(new IllegalStateException("password=hunter2"), request);

            assertThat(appender.list).hasSize(1);
            assertThat(appender.list.getFirst().getLevel()).isEqualTo(Level.ERROR);
            assertThat(appender.list.getFirst().getFormattedMessage()).contains("IllegalStateException").doesNotContain("hunter2");
        }

        @Test
        @DisplayName("does not log a 409 at ERROR")
        void conflictBelowError() {
            handler.handleConcurrencyFailure(new ConcurrencyFailureException("x"), request);

            assertThat(appender.list).extracting(ILoggingEvent::getLevel).containsExactly(Level.DEBUG);
        }
    }
}
