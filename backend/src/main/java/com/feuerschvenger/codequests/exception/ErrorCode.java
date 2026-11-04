package com.feuerschvenger.codequests.exception;

/**
 * Stable machine-readable codes carried in the {@code code} property of every problem response.
 * <p>
 * Clients can branch on a code without parsing text. Each code has a fixed message in {@code messages.properties}, so a response never contains text derived from the request or from an exception.
 * </p>
 */
public enum ErrorCode {

    /** A field or parameter failed validation. */
    VALIDATION_FAILED("error.validation"),
    /** The body is missing, not JSON, or has the wrong shape. */
    MALFORMED_REQUEST("error.malformed-request"),
    /** The idea id does not exist. */
    IDEA_NOT_FOUND("error.idea-not-found"),
    /** No route matches the request. */
    RESOURCE_NOT_FOUND("error.not-found"),
    /** The route exists but not for this HTTP method. */
    METHOD_NOT_ALLOWED("error.method-not-allowed"),
    /** The request content type is not supported. */
    UNSUPPORTED_MEDIA_TYPE("error.unsupported-media-type"),
    /** The server cannot produce an accepted response type. */
    NOT_ACCEPTABLE("error.not-acceptable"),
    /** The request collides with the current state, and a retry may succeed. */
    CONFLICT("error.conflict"),
    /** The caller exceeded a rate limit. */
    RATE_LIMITED("error.rate-limited"),
    /** Any other client error. */
    REQUEST_FAILED("error.request-failed"),
    /** An unexpected server failure. */
    INTERNAL_ERROR("error.generic");

    private final String messageKey;

    ErrorCode(String messageKey) {
        this.messageKey = messageKey;
    }

    /** Returns the key of the fixed message in the message bundle. */
    public String messageKey() {
        return messageKey;
    }
}
