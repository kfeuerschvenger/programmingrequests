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
import java.util.stream.Stream;

/**
 * Logs method, path template, status and duration of every API request.
 * <p>
 * The path is the matched route pattern (for example {@code /api/ideas/{id}}), never the raw URI, so identifiers and user input stay out of the log and the output groups cleanly. A request that matched no route is logged as {@code UNMAPPED}. The actuator, the OpenAPI document and Swagger UI are skipped, at the paths they are configured to use, as is the error dispatch, which would otherwise log the same request twice.
 * </p>
 */
@Slf4j
@Component
@Order(FilterOrder.TIMING)
public class RequestTimingFilter extends OncePerRequestFilter {

    private static final String LOG_TIMING = "{} {} -> {} in {}ms";
    private static final String UNMAPPED = "UNMAPPED";
    private static final int STATUS_ON_FAILURE = 500;
    private static final String DEFAULT_SWAGGER_ASSETS = "/swagger-ui";

    private final List<String> excludedPaths;

    /**
     * Creates the filter, excluding the actuator, the OpenAPI document and Swagger UI at the paths they are configured to use.
     *
     * @param managementPath value of {@code management.endpoints.web.base-path}, the actuator
     * @param apiDocsPath    value of {@code springdoc.api-docs.path}, the OpenAPI document
     * @param swaggerUiPath  value of {@code springdoc.swagger-ui.path}, the Swagger UI page
     */
    public RequestTimingFilter(
            @Value("${management.endpoints.web.base-path:/actuator}") String managementPath,
            @Value("${springdoc.api-docs.path:/v3/api-docs}") String apiDocsPath,
            @Value("${springdoc.swagger-ui.path:/swagger-ui.html}") String swaggerUiPath) {
        this.excludedPaths = Stream.of(normalise(managementPath), normalise(apiDocsPath), normalise(swaggerUiPath),
                        swaggerUiPrefix(swaggerUiPath), DEFAULT_SWAGGER_ASSETS)
                .filter(path -> !path.isEmpty())
                .distinct()
                .toList();
    }

    /**
     * Returns the prefix under which a configured Swagger UI page serves its resources: the normalised page path without a file extension, so {@code /swagger-ui.html} gives {@code /swagger-ui}. Taking the parent directory instead would exclude every sibling route when the page is configured below an API path. A path without a slash is normalised first, so it cannot fail.
     */
    static String swaggerUiPrefix(String configuredPath) {
        var path = normalise(configuredPath);
        var lastSlash = path.lastIndexOf('/');
        var lastDot = path.lastIndexOf('.');
        return lastDot > Math.max(lastSlash, 0) ? path.substring(0, lastDot) : path;
    }

    /**
     * Gives a configured path a leading slash and no trailing one. A null or blank value becomes empty.
     */
    static String normalise(String configuredPath) {
        if (configuredPath == null || configuredPath.isBlank()) {
            return "";
        }
        var path = configuredPath.strip();
        if (!path.startsWith("/")) {
            path = "/" + path;
        }
        return path.length() > 1 && path.endsWith("/") ? path.substring(0, path.length() - 1) : path;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        var path = request.getRequestURI().substring(request.getContextPath().length());
        return excludedPaths.stream().anyMatch(excluded -> path.equals(excluded) || path.startsWith(excluded + "/"));
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

    private static String pathTemplate(HttpServletRequest request) {
        var pattern = request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
        return pattern instanceof String template ? template : UNMAPPED;
    }
}
