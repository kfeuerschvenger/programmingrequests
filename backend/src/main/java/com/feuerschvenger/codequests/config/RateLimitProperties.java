package com.feuerschvenger.codequests.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

/**
 * Rate limit settings, overridable through environment variables (see {@code application.properties}).
 *
 * @param create            limit on creating ideas, per client
 * @param vote              limit on casting or withdrawing votes, per client
 * @param maxTrackedClients upper bound on the clients remembered per limit; the least recently used are dropped first
 */
@ConfigurationProperties(prefix = "app.rate-limit")
public record RateLimitProperties(Limit create, Limit vote, long maxTrackedClients) {

    /**
     * Rejects missing or non-positive values.
     */
    public RateLimitProperties {
        if (create == null || vote == null) {
            throw new IllegalArgumentException("Both rate limits, create and vote, must be configured");
        }
        if (maxTrackedClients < 1) {
            throw new IllegalArgumentException("app.rate-limit.max-tracked-clients must be at least 1");
        }
    }

    /**
     * One limit: at most {@code capacity} calls per {@code window}.
     *
     * @param capacity calls allowed in one window
     * @param window   length of the window
     */
    public record Limit(int capacity, Duration window) {

        /**
         * Rejects a non-positive capacity or window.
         */
        public Limit {
            if (capacity < 1) {
                throw new IllegalArgumentException("A rate limit capacity must be at least 1");
            }
            if (window == null || window.isZero() || window.isNegative()) {
                throw new IllegalArgumentException("A rate limit window must be a positive duration");
            }
        }
    }
}
