package com.feuerschvenger.codequests.util;

import org.slf4j.Logger;
import org.slf4j.helpers.MessageFormatter;

import java.util.regex.Pattern;

/**
 * Logging helpers that keep user input and exception messages out of the log.
 * <p>
 * Every argument is turned into a single line: control characters (CR, LF, tab, the rest of the control range, NEL and the Unicode line and paragraph separators) are removed and the value is truncated. A {@link Throwable} argument is reduced to its class chain, because exception messages often embed user input or SQL fragments.
 * </p>
 */
public final class SecureLogger {

    private static final int MAX_ARG_LENGTH = 256;
    private static final int MAX_CAUSE_DEPTH = 10;
    private static final String TRUNCATION_SUFFIX = "...";
    private static final String NULL_VALUE = "null";
    private static final Pattern CONTROL_CHARS = Pattern.compile("[\\p{Cntrl}\\u0085\\u2028\\u2029]");

    private SecureLogger() {
    }

    /** Returns the value as one line of at most 256 characters, with control characters removed. */
    public static String sanitize(Object value) {
        if (value == null) {
            return NULL_VALUE;
        }
        var cleaned = stripControl(String.valueOf(value));
        if (cleaned.length() <= MAX_ARG_LENGTH) {
            return cleaned;
        }
        return cleaned.substring(0, MAX_ARG_LENGTH - TRUNCATION_SUFFIX.length()) + TRUNCATION_SUFFIX;
    }

    private static String stripControl(String value) {
        return CONTROL_CHARS.matcher(value).replaceAll("");
    }

    /** Describes a throwable by the class names of its cause chain, never by its message. */
    public static String describe(Throwable thrown) {
        if (thrown == null) {
            return NULL_VALUE;
        }
        var description = new StringBuilder();
        var current = thrown;
        for (var depth = 0; current != null && depth < MAX_CAUSE_DEPTH; depth++) {
            if (!description.isEmpty()) {
                description.append(" <- ");
            }
            description.append(current.getClass().getName());
            current = current.getCause() == current ? null : current.getCause();
        }
        return description.toString();
    }

    public static void debug(Logger logger, String message, Object... args) {
        if (logger.isDebugEnabled()) {
            logger.debug(format(message, args));
        }
    }

    public static void info(Logger logger, String message, Object... args) {
        if (logger.isInfoEnabled()) {
            logger.info(format(message, args));
        }
    }

    public static void warn(Logger logger, String message, Object... args) {
        if (logger.isWarnEnabled()) {
            logger.warn(format(message, args));
        }
    }

    public static void error(Logger logger, String message, Object... args) {
        if (logger.isErrorEnabled()) {
            logger.error(format(message, args));
        }
    }

    /** Logs an error followed by {@code | cause=<class chain>}; the stack trace and the exception message are not logged. */
    public static void errorWithCause(Logger logger, String message, Throwable thrown, Object... args) {
        if (logger.isErrorEnabled()) {
            logger.error(format(message, args) + " | cause=" + describe(thrown));
        }
    }

    private static String format(String message, Object... args) {
        var sanitized = new Object[args == null ? 0 : args.length];
        for (var i = 0; i < sanitized.length; i++) {
            sanitized[i] = sanitizeArg(args[i]);
        }
        return MessageFormatter.arrayFormat(message == null ? NULL_VALUE : stripControl(message), sanitized).getMessage();
    }

    private static Object sanitizeArg(Object arg) {
        if (arg instanceof Number || arg instanceof Boolean || arg instanceof Enum<?>) {
            return arg;
        }
        if (arg instanceof Throwable thrown) {
            return describe(thrown);
        }
        return sanitize(arg);
    }
}
