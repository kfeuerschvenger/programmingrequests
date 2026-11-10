package com.feuerschvenger.codequests.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

/**
 * Cross-origin access, off unless origins are configured.
 * <p>
 * The frontend reaches the API through the same origin (nginx in production, the Vite proxy in development), so no CORS is needed by default. When {@code CORS_ALLOWED_ORIGINS} lists origins, exactly those origins may call {@code /api} with GET, POST, PUT and DELETE. Credentials are never allowed and no wildcard origin is built in.
 * </p>
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    private static final long PREFLIGHT_CACHE_SECONDS = 3600;

    private final String[] allowedOrigins;

    /**
     * Creates the configuration.
     *
     * @param allowedOrigins comma-separated origins from {@code app.cors.allowed-origins}, empty by default
     */
    public CorsConfig(@Value("${app.cors.allowed-origins:}") List<String> allowedOrigins) {
        this.allowedOrigins = allowedOrigins.stream()
                .map(String::strip)
                .filter(origin -> !origin.isEmpty())
                .toArray(String[]::new);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        if (allowedOrigins.length == 0) {
            return;
        }
        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigins)
                .allowedMethods("GET", "POST", "PUT", "DELETE")
                .allowedHeaders("Content-Type", "Accept", "X-Request-Id")
                .exposedHeaders("Location", "Retry-After", "X-Request-Id")
                .allowCredentials(false)
                .maxAge(PREFLIGHT_CACHE_SECONDS);
    }
}
