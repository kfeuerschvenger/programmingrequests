package com.feuerschvenger.codequests.config;

import com.feuerschvenger.codequests.ratelimit.RateLimitInterceptor;
import com.feuerschvenger.codequests.ratelimit.RateLimitScope;
import com.feuerschvenger.codequests.ratelimit.RateLimiter;
import com.feuerschvenger.codequests.security.ClientIdentityResolver;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Set;

/**
 * Registers the rate limits: creating ideas, and casting or withdrawing votes. Reads are not limited.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final RateLimiter rateLimiter;
    private final ClientIdentityResolver identities;

    /**
     * Creates the configuration.
     */
    public WebConfig(RateLimiter rateLimiter, ClientIdentityResolver identities) {
        this.rateLimiter = rateLimiter;
        this.identities = identities;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new RateLimitInterceptor(rateLimiter, identities, RateLimitScope.CREATE_IDEA, Set.of("POST")))
                .addPathPatterns("/api/ideas");
        registry.addInterceptor(new RateLimitInterceptor(rateLimiter, identities, RateLimitScope.VOTE, Set.of("PUT", "DELETE")))
                .addPathPatterns("/api/ideas/*/vote");
    }
}
