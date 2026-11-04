package com.feuerschvenger.codequests.exception;

/**
 * Raised when a caller exceeds a rate limit. It carries the wait time for the {@code Retry-After} header.
 */
public class RateLimitExceededException extends RuntimeException {

    private final long retryAfterSeconds;

    /**
     * Creates the exception.
     *
     * @param retryAfterSeconds whole seconds until the caller may try again
     */
    public RateLimitExceededException(long retryAfterSeconds) {
        super("Rate limit exceeded");
        this.retryAfterSeconds = retryAfterSeconds;
    }

    /** Returns the wait time in whole seconds. */
    public long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}
