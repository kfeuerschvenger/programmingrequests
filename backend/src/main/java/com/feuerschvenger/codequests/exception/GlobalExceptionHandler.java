package com.feuerschvenger.codequests.exception;

import com.feuerschvenger.codequests.config.MDCFilter;
import com.feuerschvenger.codequests.util.SecureLogger;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.beans.TypeMismatchException;
import org.springframework.context.MessageSource;
import org.springframework.context.MessageSourceResolvable;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.context.support.DefaultMessageSourceResolvable;
import org.springframework.dao.ConcurrencyFailureException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Turns every failure into an RFC 9457 problem response.
 * <p>
 * It extends {@link ResponseEntityExceptionHandler}, so the framework's own failures (405, 415, 404 for unknown routes, unreadable bodies) take the same path as application errors. Three rules hold for every response. The text comes from the message bundle and never from the request or from an exception. A validation error names the field, not the value. Each response carries a stable {@code code} property from {@link ErrorCode}.
 * </p>
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    /** Name of the problem property that carries the {@link ErrorCode}. */
    public static final String CODE_PROPERTY = "code";

    /** Name of the problem property that lists the failed fields. */
    public static final String ERRORS_PROPERTY = "errors";

    private static final String INSTANCE_PREFIX = "urn:request-id:";
    private static final String FIELD_MESSAGE_KEY = "validation.";
    private static final String FALLBACK_FIELD_KEY = "validation.invalid";
    private static final String FALLBACK_FIELD_TEXT = "The value is not valid.";
    private static final String GENERAL_FIELD = "request";
    private static final String TYPE_MISMATCH = "typeMismatch";
    private static final String MISSING = "required";

    private final MessageSource messageSource;

    /**
     * Creates the handler.
     *
     * @param messageSource bundle holding every response text
     */
    public GlobalExceptionHandler(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    /** An idea id that does not exist. */
    @ExceptionHandler(IdeaNotFoundException.class)
    public ResponseEntity<Object> handleIdeaNotFound(IdeaNotFoundException ex, WebRequest request) {
        return problem(ex, HttpStatus.NOT_FOUND, ErrorCode.IDEA_NOT_FOUND, request);
    }

    /** A unique-constraint race or a lock failure: the client may retry. */
    @ExceptionHandler({DataIntegrityViolationException.class, ConcurrencyFailureException.class})
    public ResponseEntity<Object> handleConflict(Exception ex, WebRequest request) {
        return problem(ex, HttpStatus.CONFLICT, ErrorCode.CONFLICT, request);
    }

    /** Anything unexpected. The cause chain is logged by class name only. */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleUnexpected(Exception ex, WebRequest request) {
        SecureLogger.errorWithCause(log, "Unhandled exception", ex);
        return problem(ex, HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.INTERNAL_ERROR, request);
    }

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex, HttpHeaders headers,
                                                                  HttpStatusCode status, WebRequest request) {
        var issues = new ArrayList<FieldIssue>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            issues.add(new FieldIssue(error.getField(), fieldMessage(error.getField(), lastCode(error))));
        }
        ex.getBindingResult().getGlobalErrors()
                .forEach(error -> issues.add(new FieldIssue(GENERAL_FIELD, fieldMessage(GENERAL_FIELD, lastCode(error)))));
        return validationProblem(ex, issues, headers, request);
    }

    @Override
    protected ResponseEntity<Object> handleHandlerMethodValidationException(HandlerMethodValidationException ex, HttpHeaders headers,
                                                                            HttpStatusCode status, WebRequest request) {
        var issues = new ArrayList<FieldIssue>();
        ex.getParameterValidationResults().forEach(result -> {
            var field = result.getMethodParameter().getParameterName();
            result.getResolvableErrors().forEach(error ->
                    issues.add(new FieldIssue(field == null ? GENERAL_FIELD : field, fieldMessage(field, lastCode(error)))));
        });
        return validationProblem(ex, issues, headers, request);
    }

    @Override
    protected ResponseEntity<Object> handleTypeMismatch(TypeMismatchException ex, HttpHeaders headers, HttpStatusCode status,
                                                        WebRequest request) {
        var field = ex instanceof MethodArgumentTypeMismatchException mismatch ? mismatch.getName() : ex.getPropertyName();
        var issues = List.of(new FieldIssue(field == null ? GENERAL_FIELD : field, fieldMessage(field, TYPE_MISMATCH)));
        return validationProblem(ex, issues, headers, request);
    }

    @Override
    protected ResponseEntity<Object> handleMissingServletRequestParameter(MissingServletRequestParameterException ex,
                                                                          HttpHeaders headers, HttpStatusCode status,
                                                                          WebRequest request) {
        var issues = List.of(new FieldIssue(ex.getParameterName(), fieldMessage(ex.getParameterName(), MISSING)));
        return validationProblem(ex, issues, headers, request);
    }

    @Override
    protected ResponseEntity<Object> handleHttpMessageNotReadable(HttpMessageNotReadableException ex, HttpHeaders headers,
                                                                  HttpStatusCode status, WebRequest request) {
        return respond(ex, newProblem(HttpStatus.BAD_REQUEST, ErrorCode.MALFORMED_REQUEST), headers, HttpStatus.BAD_REQUEST, request);
    }

    /**
     * Rewrites every problem body the framework builds, so the text and the code follow the same rules as the handlers above.
     */
    @Override
    protected ResponseEntity<Object> handleExceptionInternal(Exception ex, Object body, HttpHeaders headers,
                                                             HttpStatusCode statusCode, WebRequest request) {
        var response = super.handleExceptionInternal(ex, body, headers, statusCode, request);
        if (response != null && response.getBody() instanceof ProblemDetail problem) {
            var code = existingCode(problem, statusCode);
            problem.setDetail(message(code));
            var reason = HttpStatus.resolve(statusCode.value());
            problem.setTitle(reason == null ? code.name() : reason.getReasonPhrase());
            // The framework would fill instance with the request path, which is client input. The request id is validated by MDCFilter and identifies this occurrence in the log.
            problem.setInstance(URI.create(INSTANCE_PREFIX + requestId()));
            problem.setProperty(CODE_PROPERTY, code.name());
        }
        SecureLogger.info(log, "Request failed with {} ({})", statusCode.value(), ex.getClass().getSimpleName());
        return response;
    }

    /**
     * Builds a problem for the given status and code and sends it through the common path.
     *
     * @param ex      the exception that caused it
     * @param status  HTTP status
     * @param code    stable error code
     * @param request current request
     */
    protected ResponseEntity<Object> problem(Exception ex, HttpStatus status, ErrorCode code, WebRequest request) {
        return respond(ex, newProblem(status, code), new HttpHeaders(), status, request);
    }

    /**
     * Builds a 400 validation problem listing the failed fields.
     */
    private ResponseEntity<Object> validationProblem(Exception ex, List<FieldIssue> issues, HttpHeaders headers, WebRequest request) {
        var problem = newProblem(HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_FAILED);
        problem.setProperty(ERRORS_PROPERTY, issues);
        return respond(ex, problem, headers, HttpStatus.BAD_REQUEST, request);
    }

    private ResponseEntity<Object> respond(Exception ex, ProblemDetail problem, HttpHeaders headers, HttpStatusCode status,
                                           WebRequest request) {
        return handleExceptionInternal(ex, problem, headers, status, request);
    }

    private ProblemDetail newProblem(HttpStatus status, ErrorCode code) {
        var problem = ProblemDetail.forStatusAndDetail(status, message(code));
        problem.setProperty(CODE_PROPERTY, code.name());
        return problem;
    }

    private String message(ErrorCode code) {
        return messageSource.getMessage(code.messageKey(), null, LocaleContextHolder.getLocale());
    }

    /**
     * Resolves the text for a failed field: the field-specific key first, then the constraint key, then a generic one.
     */
    private String fieldMessage(String field, String constraint) {
        var resolvable = new DefaultMessageSourceResolvable(
                new String[]{FIELD_MESSAGE_KEY + field + "." + constraint, FIELD_MESSAGE_KEY + constraint, FALLBACK_FIELD_KEY},
                FALLBACK_FIELD_TEXT);
        return messageSource.getMessage(resolvable, LocaleContextHolder.getLocale());
    }

    private static String requestId() {
        var id = MDC.get(MDCFilter.REQUEST_ID_MDC_KEY);
        return id == null ? UUID.randomUUID().toString() : id;
    }

    private static String lastCode(MessageSourceResolvable error) {
        var codes = error.getCodes();
        return codes == null || codes.length == 0 ? "invalid" : codes[codes.length - 1];
    }

    /** Keeps a code a handler already set, and derives one from the status for problems the framework built. */
    private static ErrorCode existingCode(ProblemDetail problem, HttpStatusCode status) {
        var properties = problem.getProperties();
        if (properties != null && properties.get(CODE_PROPERTY) instanceof String name) {
            try {
                return ErrorCode.valueOf(name);
            } catch (IllegalArgumentException unknown) {
                // Falls through to the status-based code.
            }
        }
        return codeFor(status);
    }

    private static ErrorCode codeFor(HttpStatusCode status) {
        return switch (status.value()) {
            case 400 -> ErrorCode.MALFORMED_REQUEST;
            case 404 -> ErrorCode.RESOURCE_NOT_FOUND;
            case 405 -> ErrorCode.METHOD_NOT_ALLOWED;
            case 406 -> ErrorCode.NOT_ACCEPTABLE;
            case 409 -> ErrorCode.CONFLICT;
            case 415 -> ErrorCode.UNSUPPORTED_MEDIA_TYPE;
            case 429 -> ErrorCode.RATE_LIMITED;
            default -> status.is5xxServerError() ? ErrorCode.INTERNAL_ERROR : ErrorCode.REQUEST_FAILED;
        };
    }
}
