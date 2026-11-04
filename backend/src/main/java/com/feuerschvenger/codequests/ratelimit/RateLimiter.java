package com.feuerschvenger.codequests.ratelimit;

import com.feuerschvenger.codequests.config.RateLimitProperties;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * In-memory token-bucket rate limiter keyed by client.
 * <p>
 * Each scope owns a Caffeine cache of buckets with a maximum size and an expire-after-access of one window. A client that goes quiet is forgotten after a window, by which time its bucket would have refilled anyway, and a flood of distinct clients cannot grow the map without bound. The state is per process, so a limit is per instance.
 * </p>
 */
@Component
public class RateLimiter {

    private static final long NANOS_PER_SECOND = TimeUnit.SECONDS.toNanos(1);

    private final Map<RateLimitScope, Cache<String, Bucket>> buckets = new EnumMap<>(RateLimitScope.class);
    private final Map<RateLimitScope, RateLimitProperties.Limit> limits = new EnumMap<>(RateLimitScope.class);

    /**
     * Creates the limiter from the configured limits.
     *
     * @param properties rate limit settings
     */
    public RateLimiter(RateLimitProperties properties) {
        limits.put(RateLimitScope.CREATE_IDEA, properties.create());
        limits.put(RateLimitScope.VOTE, properties.vote());
        limits.forEach((scope, limit) -> buckets.put(scope, Caffeine.newBuilder()
                .maximumSize(properties.maxTrackedClients())
                .expireAfterAccess(limit.window())
                .build()));
    }

    /**
     * Takes one token for the client in the given scope.
     *
     * @param scope     the limit to apply
     * @param clientKey opaque client key, a hash and never a raw address
     * @return whether the call may proceed and, when it may not, how long to wait
     */
    public Decision tryAcquire(RateLimitScope scope, String clientKey) {
        var limit = limits.get(scope);
        var bucket = buckets.get(scope).get(clientKey, key -> newBucket(limit));
        var probe = bucket.tryConsumeAndReturnRemaining(1);
        if (probe.isConsumed()) {
            return Decision.permit();
        }
        var seconds = Math.max(1, (probe.getNanosToWaitForRefill() + NANOS_PER_SECOND - 1) / NANOS_PER_SECOND);
        return Decision.deny(seconds);
    }

    private static Bucket newBucket(RateLimitProperties.Limit limit) {
        return Bucket.builder()
                .addLimit(Bandwidth.builder().capacity(limit.capacity()).refillIntervally(limit.capacity(), limit.window()).build())
                .build();
    }

    /**
     * Outcome of a {@link #tryAcquire} call.
     *
     * @param allowed           true when the call may proceed
     * @param retryAfterSeconds when denied, whole seconds until a token is available, at least 1; zero when allowed
     */
    public record Decision(boolean allowed, long retryAfterSeconds) {

        /** Builds a decision that lets the call proceed. */
        public static Decision permit() {
            return new Decision(true, 0);
        }

        /**
         * Builds a decision that rejects the call.
         *
         * @param retryAfterSeconds seconds to wait, at least 1
         */
        public static Decision deny(long retryAfterSeconds) {
            return new Decision(false, retryAfterSeconds);
        }
    }
}
