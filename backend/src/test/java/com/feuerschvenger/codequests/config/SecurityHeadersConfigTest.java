package com.feuerschvenger.codequests.config;

import jakarta.servlet.ServletException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("SecurityHeadersConfig")
class SecurityHeadersConfigTest {

    private final SecurityHeadersConfig.SecurityHeadersFilter filter = new SecurityHeadersConfig.SecurityHeadersFilter();

    @Test
    @DisplayName("sets the defensive headers and a strict CSP on API responses")
    void setsApiHeaders() throws ServletException, IOException {
        var response = apply("/api/ideas");

        assertThat(response.getHeader("X-Content-Type-Options")).isEqualTo("nosniff");
        assertThat(response.getHeader("X-Frame-Options")).isEqualTo("DENY");
        assertThat(response.getHeader("Referrer-Policy")).isEqualTo("strict-origin-when-cross-origin");
        assertThat(response.getHeader("Permissions-Policy")).isEqualTo(SecurityHeadersConfig.PERMISSIONS_POLICY);
        assertThat(response.getHeader("Content-Security-Policy")).isEqualTo(SecurityHeadersConfig.API_CSP);
        assertThat(response.getHeader("Cache-Control")).isEqualTo("no-store");
    }

    @Test
    @DisplayName("relaxes the CSP and keeps caching for Swagger UI")
    void relaxesForSwagger() throws ServletException, IOException {
        var response = apply("/swagger-ui/index.html");

        assertThat(response.getHeader("Content-Security-Policy")).isEqualTo(SecurityHeadersConfig.SWAGGER_CSP);
        assertThat(response.getHeader("Cache-Control")).isNull();
        assertThat(response.getHeader("X-Frame-Options")).isEqualTo("DENY");
    }

    @Test
    @DisplayName("does not relax the CSP for paths that only look like Swagger UI")
    void ignoresTraversalAndEncodedVariants() throws ServletException, IOException {
        for (var path : new String[] {"/swagger-ui/../requests", "/swagger-ui/%2e%2e/requests", "/swagger-uix"}) {
            var response = apply(path);

            assertThat(response.getHeader("Content-Security-Policy")).as(path).isEqualTo(SecurityHeadersConfig.API_CSP);
        }
    }

    @Test
    @DisplayName("registers the filter after the MDC and timing filters")
    void registersWithExplicitOrder() {
        var registration = new SecurityHeadersConfig().securityHeadersFilter();

        assertThat(registration.getOrder()).isGreaterThan(FilterOrder.TIMING);
        assertThat(FilterOrder.TIMING).isGreaterThan(FilterOrder.MDC);
    }

    private MockHttpServletResponse apply(String path) throws ServletException, IOException {
        var response = new MockHttpServletResponse();
        filter.doFilter(new MockHttpServletRequest("GET", path), response, new MockFilterChain());
        return response;
    }
}
