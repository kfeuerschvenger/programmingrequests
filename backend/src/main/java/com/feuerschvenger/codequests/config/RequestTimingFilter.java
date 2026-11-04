package com.feuerschvenger.codequests.config;

import com.feuerschvenger.codequests.util.SecureLogger;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.HandlerMapping;

import java.io.IOException;
import java.util.List;

/**
 * Logs method, path template, status and duration of every API request.
 * <p>
 * The path is the matched route pattern (for example {@code /requests/{id}}), never the raw URI, so identifiers and user input stay out of the log and the output groups cleanly. A request that matched no route is logged as {@code UNMAPPED}. Actuator and OpenAPI paths are skipped, as is the error dispatch, which would otherwise log the same request twice.
 * </p>
 */
@Slf4j
@Component
@Order(FilterOrder.TIMING)
public class RequestTimingFilter extends OncePerRequestFilter {

    private static final String LOG_TIMING = "{} {} -> {} in {}ms";
    private static final String UNMAPPED = "UNMAPPED";
    private static final int STATUS_ON_FAILURE = 500;

    private final List<String> excludedPrefixes;

    public RequestTimingFilter(
            @Value("${management.endpoints.web.base-path:/actuator}") String managementPath,
            @Value("${springdoc.api-docs.path:/v3/api-docs}") String apiDocsPath,
            @Value("${springdoc.swagger-ui.path:/swagger-ui.html}") String swaggerUiPath) {
        this.excludedPrefixes = List.of(trimTrailingSlash(managementPath), trimTrailingSlash(apiDocsPath), swaggerUiPrefix(swaggerUiPath));
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        var path = request.getRequestURI().substring(request.getContextPath().length());
        return excludedPrefixes.stream().anyMatch(prefix -> path.equals(prefix) || path.startsWith(prefix + "/"));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        var start = System.nanoTime();
        try {
            chain.doFilter(request, response);
            logTiming(request, response.getStatus(), start);
        } catch (Throwable thrown) {
            // The container has not written the error status yet, so the response still reports 200.
            logTiming(request, STATUS_ON_FAILURE, start);
            throw thrown;
        }
    }

    private static void logTiming(HttpServletRequest request, int status, long startNanos) {
        var elapsedMs = (System.nanoTime() - startNanos) / 1_000_000;
        SecureLogger.info(log, LOG_TIMING, request.getMethod(), pathTemplate(request), status, elapsedMs);
    }

    private static String trimTrailingSlash(String path) {
        return path.length() > 1 && path.endsWith("/") ? path.substring(0, path.length() - 1) : path;
    }

    /** The Swagger UI path usually names a page such as {@code /swagger-ui.html}; its assets live under the {@code /swagger-ui} directory. */
    private static String swaggerUiPrefix(String swaggerUiPath) {
        var trimmed = trimTrailingSlash(swaggerUiPath);
        return trimmed.endsWith(".html") ? trimmed.substring(0, trimmed.lastIndexOf('/')) + "/swagger-ui" : trimmed;
    }

    private static String pathTemplate(HttpServletRequest request) {
        var pattern = request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
        return pattern instanceof String template ? template : UNMAPPED;
    }
}
