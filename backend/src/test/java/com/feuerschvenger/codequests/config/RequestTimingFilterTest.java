package com.feuerschvenger.codequests.config;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.slf4j.LoggerFactory;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.servlet.HandlerMapping;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("RequestTimingFilter")
class RequestTimingFilterTest {

    private final Logger logger = (Logger) LoggerFactory.getLogger(RequestTimingFilter.class);
    private final ListAppender<ILoggingEvent> appender = new ListAppender<>();

    @BeforeEach
    void attach() {
        logger.setLevel(Level.INFO);
        appender.start();
        logger.addAppender(appender);
    }

    @AfterEach
    void detach() {
        logger.detachAppender(appender);
    }

    private static RequestTimingFilter defaults() {
        return new RequestTimingFilter("/manage", "/api-docs", "/swagger-ui.html");
    }

    private static boolean skips(RequestTimingFilter filter, String path) {
        return filter.shouldNotFilter(new MockHttpServletRequest("GET", path));
    }

    @Nested
    @DisplayName("logging")
    class Logging {

        @Test
        @DisplayName("logs method, matched route pattern, status and duration")
        void logsStatus() throws ServletException, IOException {
            var request = new MockHttpServletRequest("GET", "/api/ideas/42");
            request.setAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE, "/api/ideas/{id}");
            var response = new MockHttpServletResponse();
            response.setStatus(404);

            defaults().doFilter(request, response, new MockFilterChain());

            assertThat(appender.list).singleElement().satisfies(event -> {
                assertThat(event.getLevel()).isEqualTo(Level.INFO);
                assertThat(event.getFormattedMessage()).startsWith("GET /api/ideas/{id} -> 404 in ").endsWith("ms");
                assertThat(event.getFormattedMessage()).doesNotContain("42");
            });
        }

        @Test
        @DisplayName("logs the response status of a completed request")
        void logsCompletedStatus() throws ServletException, IOException {
            var response = new MockHttpServletResponse();
            response.setStatus(201);

            defaults().doFilter(new MockHttpServletRequest("POST", "/api/ideas"), response, (req, res) -> { });

            assertThat(appender.list).singleElement()
                    .extracting(ILoggingEvent::getFormattedMessage)
                    .asString().startsWith("POST UNMAPPED -> 201 in ");
        }

        @Test
        @DisplayName("logs UNMAPPED when no route matched")
        void logsUnmapped() throws ServletException, IOException {
            defaults().doFilter(new MockHttpServletRequest("GET", "/api/whatever"), new MockHttpServletResponse(), new MockFilterChain());

            assertThat(appender.list).singleElement().extracting(ILoggingEvent::getFormattedMessage)
                    .asString().startsWith("GET UNMAPPED -> 200");
        }

        @Test
        @DisplayName("logs status 500 and rethrows when the chain fails")
        void logsFailureAsServerError() {
            var response = new MockHttpServletResponse();

            assertThatThrownBy(() -> defaults().doFilter(new MockHttpServletRequest("GET", "/api/ideas"), response, (req, res) -> {
                throw new IllegalStateException("boom");
            })).isInstanceOf(IllegalStateException.class);

            assertThat(appender.list).singleElement()
                    .extracting(ILoggingEvent::getFormattedMessage)
                    .asString().contains("-> 500 in ");
        }

        @Test
        @DisplayName("skips the error dispatch")
        void skipsErrorDispatch() throws ServletException, IOException {
            var error = new MockHttpServletRequest("GET", "/api/ideas");
            error.setAttribute(RequestDispatcher.ERROR_REQUEST_URI, "/api/ideas");

            defaults().doFilter(error, new MockHttpServletResponse(), (req, res) -> { });

            assertThat(appender.list).isEmpty();
        }
    }

    @Nested
    @DisplayName("excluded paths")
    class Exclusions {

        @ParameterizedTest
        @ValueSource(strings = {"/manage", "/manage/health", "/api-docs", "/api-docs/swagger-config", "/swagger-ui.html", "/swagger-ui", "/swagger-ui/index.html"})
        @DisplayName("skips the actuator, the OpenAPI document and the default Swagger UI")
        void skipsDocumentation(String path) {
            assertThat(skips(defaults(), path)).isTrue();
        }

        @ParameterizedTest
        @ValueSource(strings = {"/api/ideas", "/api/ideas/1/vote", "/swagger-uix", "/managed", "/api-docs-x"})
        @DisplayName("keeps timing the API and look-alike paths")
        void keepsApi(String path) {
            assertThat(skips(defaults(), path)).isFalse();
        }

        @Test
        @DisplayName("excludes the configured Swagger page itself and its resources")
        void customSwaggerPath() {
            var filter = new RequestTimingFilter("/manage", "/api-docs", "/docs/ui.html");

            assertThat(skips(filter, "/docs/ui.html")).isTrue();
            assertThat(skips(filter, "/docs/ui/index.html")).isTrue();
            assertThat(skips(filter, "/docs/other")).isFalse();
        }

        @Test
        @DisplayName("does not fail when the configured Swagger path has no slash")
        void swaggerPathWithoutSlash() {
            var filter = new RequestTimingFilter("manage", "api-docs", "docs");

            assertThat(skips(filter, "/docs")).isTrue();
            assertThat(skips(filter, "/docs/index.html")).isTrue();
            assertThat(skips(filter, "/api-docs")).isTrue();
            assertThat(skips(filter, "/manage/health")).isTrue();
            assertThat(skips(filter, "/api/ideas")).isFalse();
        }

        @Test
        @DisplayName("tolerates blank settings")
        void blankSettings() {
            var filter = new RequestTimingFilter(" ", null, "");

            assertThat(skips(filter, "/api/ideas")).isFalse();
            assertThat(skips(filter, "/swagger-ui/index.html")).isTrue();
        }

        @Test
        @DisplayName("never excludes a sibling API route when the page is configured below it")
        void doesNotExcludeParentDirectory() {
            var filter = new RequestTimingFilter("/manage", "/api-docs", "/api/swagger.html");

            assertThat(skips(filter, "/api/swagger.html")).isTrue();
            assertThat(skips(filter, "/api/ideas")).isFalse();
        }
    }

    @Nested
    @DisplayName("path normalising")
    class Normalising {

        @Test
        @DisplayName("adds a leading slash and drops a trailing one")
        void normalise() {
            assertThat(RequestTimingFilter.normalise("docs/")).isEqualTo("/docs");
            assertThat(RequestTimingFilter.normalise(" /docs ")).isEqualTo("/docs");
            assertThat(RequestTimingFilter.normalise("/")).isEqualTo("/");
            assertThat(RequestTimingFilter.normalise(null)).isEmpty();
        }

        @Test
        @DisplayName("strips the file extension of the page path")
        void prefix() {
            assertThat(RequestTimingFilter.swaggerUiPrefix("/swagger-ui.html")).isEqualTo("/swagger-ui");
            assertThat(RequestTimingFilter.swaggerUiPrefix("swagger")).isEqualTo("/swagger");
            assertThat(RequestTimingFilter.swaggerUiPrefix("/v1.0/ui")).isEqualTo("/v1.0/ui");
        }
    }
}
