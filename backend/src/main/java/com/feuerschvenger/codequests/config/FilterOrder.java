package com.feuerschvenger.codequests.config;

import org.springframework.core.Ordered;

/**
 * Explicit positions of the servlet filters, lowest value first.
 * <p>
 * The request id has to exist before anything logs, and the timing filter has to wrap everything that can fail, so the order is fixed here rather than left to bean registration order.
 * </p>
 */
public final class FilterOrder {

    /** Request id into the MDC: runs first so every later log line carries it. */
    public static final int MDC = Ordered.HIGHEST_PRECEDENCE;

    /** Request timing: wraps the rest of the chain. */
    public static final int TIMING = Ordered.HIGHEST_PRECEDENCE + 10;

    /** Security headers: set before the response can be committed downstream. */
    public static final int SECURITY_HEADERS = Ordered.HIGHEST_PRECEDENCE + 20;

    private FilterOrder() {
    }
}
