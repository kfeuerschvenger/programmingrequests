package com.feuerschvenger.codequests.config;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Registers the filter that adds defensive headers to every response.
 * <p>
 * API responses get a CSP that allows nothing and {@code Cache-Control: no-store}. Swagger UI needs its own scripts and styles, so it receives a relaxed CSP and keeps normal caching; it is only reachable when the {@code dev} profile enables it.
 * </p>
 */
@Configuration
public class SecurityHeadersConfig {

    static final String API_CSP = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'";
    static final String SWAGGER_CSP = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; "
            + "img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'";
    static final String PERMISSIONS_POLICY = "geolocation=(), microphone=(), camera=()";

    private static final String SWAGGER_PREFIX = "/swagger-ui";

    @Bean
    public FilterRegistrationBean<Filter> securityHeadersFilter() {
        var registration = new FilterRegistrationBean<Filter>(new SecurityHeadersFilter());
        registration.setOrder(FilterOrder.SECURITY_HEADERS);
        registration.addUrlPatterns("/*");
        return registration;
    }

    static final class SecurityHeadersFilter extends OncePerRequestFilter {

        @Override
        protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
                throws ServletException, IOException {
            response.setHeader("X-Content-Type-Options", "nosniff");
            response.setHeader("X-Frame-Options", "DENY");
            response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
            response.setHeader("Permissions-Policy", PERMISSIONS_POLICY);
            if (isSwagger(request)) {
                response.setHeader("Content-Security-Policy", SWAGGER_CSP);
            } else {
                response.setHeader("Content-Security-Policy", API_CSP);
                response.setHeader("Cache-Control", "no-store");
            }
            chain.doFilter(request, response);
        }

        private static boolean isSwagger(HttpServletRequest request) {
            var path = request.getRequestURI().substring(request.getContextPath().length());
            return path.equals(SWAGGER_PREFIX) || path.startsWith(SWAGGER_PREFIX + "/");
        }
    }
}
