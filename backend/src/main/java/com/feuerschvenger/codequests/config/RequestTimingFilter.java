package com.feuerschvenger.codequests.config;

import com.feuerschvenger.codequests.util.SecureLogger;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.HandlerMapping;

import java.io.IOException;
import java.util.List;

/**
 * Logs method, path template, status and duration of every API request.
 * <p>
 * The path is the matched route pattern (for example {@code /requests/{id}}), never the raw URI, so identifiers and user input stay out of the log and the output groups cleanly. A request that matched no route is logged as {@code UNMAPPED}. Actuator and OpenAPI paths are skipped.
 * </p>
 */
@Slf4j
@Component
@Order(FilterOrder.TIMING)
public class RequestTimingFilter extends OncePerRequestFilter {

    private static final String LOG_TIMING = "{} {} -> {} in {}ms";
    private static final String UNMAPPED = "UNMAPPED";
    private static final List<String> EXCLUDED_PREFIXES = List.of("/manage", "/api-docs", "/swagger-ui");

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        var path = request.getRequestURI().substring(request.getContextPath().length());
        return EXCLUDED_PREFIXES.stream().anyMatch(prefix -> path.equals(prefix) || path.startsWith(prefix + "/"));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        var start = System.nanoTime();
        try {
            chain.doFilter(request, response);
        } finally {
            var elapsedMs = (System.nanoTime() - start) / 1_000_000;
            SecureLogger.info(log, LOG_TIMING, request.getMethod(), pathTemplate(request), response.getStatus(), elapsedMs);
        }
    }

    private static String pathTemplate(HttpServletRequest request) {
        var pattern = request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
        return pattern instanceof String template ? template : UNMAPPED;
    }
}
