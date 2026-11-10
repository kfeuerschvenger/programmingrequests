package com.feuerschvenger.codequests.ratelimit;

/**
 * The independent limits the API applies. Each scope has its own buckets, so voting does not use up the allowance for creating ideas.
 */
public enum RateLimitScope {

    /** Creating an idea. */
    CREATE_IDEA,
    /** Casting or withdrawing a vote. */
    VOTE
}
