package com.feuerschvenger.codequests.config;

import com.feuerschvenger.codequests.ratelimit.RateLimitInterceptor;
import com.feuerschvenger.codequests.ratelimit.RateLimitScope;
import com.feuerschvenger.codequests.ratelimit.RateLimiter;
import com.feuerschvenger.codequests.security.VoterHasher;
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
    private final VoterHasher voterHasher;

    /**
     * Creates the configuration.
     */
    public WebConfig(RateLimiter rateLimiter, VoterHasher voterHasher) {
        this.rateLimiter = rateLimiter;
        this.voterHasher = voterHasher;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new RateLimitInterceptor(rateLimiter, voterHasher, RateLimitScope.CREATE_IDEA, Set.of("POST")))
                .addPathPatterns("/api/ideas");
        registry.addInterceptor(new RateLimitInterceptor(rateLimiter, voterHasher, RateLimitScope.VOTE, Set.of("PUT", "DELETE")))
                .addPathPatterns("/api/ideas/*/vote");
    }
}
