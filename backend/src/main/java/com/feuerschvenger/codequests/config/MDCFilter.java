package com.feuerschvenger.codequests.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Puts a request id in the MDC for the whole request and echoes it in the {@code X-Request-Id} response header.
 * <p>
 * An id sent by the client is reused only after its control characters are removed and the remainder matches {@code [A-Za-z0-9._-]{1,64}}; anything else is replaced by a generated UUID. Stripping control characters before the check keeps a forged header from splitting a log line.
 * </p>
 */
@Component
@Order(FilterOrder.MDC)
public class MDCFilter extends OncePerRequestFilter {

    /** Header used to receive and return the request id. */
    public static final String REQUEST_ID_HEADER = "X-Request-Id";

    /** MDC key referenced by the log pattern as {@code %X{requestId}}. */
    public static final String REQUEST_ID_MDC_KEY = "requestId";

    private static final String REQUEST_ID_ATTRIBUTE = MDCFilter.class.getName() + ".REQUEST_ID";
    private static final Pattern CONTROL_CHARS = Pattern.compile("[\\p{Cntrl}\\u0085\\u2028\\u2029]");
    private static final Pattern ACCEPTED_ID = Pattern.compile("^[A-Za-z0-9._-]{1,64}$");

    /** The error dispatch runs this filter again, so the id is carried in a request attribute instead of being minted twice. */
    @Override
    protected boolean shouldNotFilterErrorDispatch() {
        return false;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        var requestId = request.getAttribute(REQUEST_ID_ATTRIBUTE) instanceof String existing
                ? existing
                : resolveRequestId(request.getHeader(REQUEST_ID_HEADER));
        request.setAttribute(REQUEST_ID_ATTRIBUTE, requestId);
        MDC.put(REQUEST_ID_MDC_KEY, requestId);
        response.setHeader(REQUEST_ID_HEADER, requestId);
        try {
            chain.doFilter(request, response);
        } finally {
            MDC.remove(REQUEST_ID_MDC_KEY);
        }
    }

    static String resolveRequestId(String inbound) {
        if (inbound != null) {
            var cleaned = CONTROL_CHARS.matcher(inbound).replaceAll("");
            if (ACCEPTED_ID.matcher(cleaned).matches()) {
                return cleaned;
            }
        }
        return UUID.randomUUID().toString();
    }
}
