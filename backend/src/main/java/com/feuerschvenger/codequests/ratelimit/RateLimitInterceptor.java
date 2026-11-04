package com.feuerschvenger.codequests.ratelimit;

import com.feuerschvenger.codequests.exception.RateLimitExceededException;
import com.feuerschvenger.codequests.security.VoterHasher;
import com.feuerschvenger.codequests.util.SecureLogger;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Set;

/**
 * Applies one {@link RateLimitScope} to the requests it is registered for.
 * <p>
 * The client is identified by the hash of the address Tomcat resolved, so the limiter never holds a raw address. When the limit is exhausted the interceptor throws {@link RateLimitExceededException}, which the global handler turns into a 429 problem with a {@code Retry-After} header.
 * </p>
 */
@Slf4j
public class RateLimitInterceptor implements HandlerInterceptor {

    private final RateLimiter rateLimiter;
    private final VoterHasher hasher;
    private final RateLimitScope scope;
    private final Set<String> methods;

    /**
     * Creates the interceptor.
     *
     * @param rateLimiter the limiter holding the buckets
     * @param hasher      turns the client address into the bucket key
     * @param scope       the limit to apply
     * @param methods     HTTP methods the limit applies to; other methods pass untouched
     */
    public RateLimitInterceptor(RateLimiter rateLimiter, VoterHasher hasher, RateLimitScope scope, Set<String> methods) {
        this.rateLimiter = rateLimiter;
        this.hasher = hasher;
        this.scope = scope;
        this.methods = methods;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!methods.contains(request.getMethod())) {
            return true;
        }
        var decision = rateLimiter.tryAcquire(scope, hasher.hashHex(request.getRemoteAddr()));
        if (decision.allowed()) {
            return true;
        }
        SecureLogger.warn(log, "Rate limit {} exceeded, retry in {}s", scope, decision.retryAfterSeconds());
        throw new RateLimitExceededException(decision.retryAfterSeconds());
    }
}
