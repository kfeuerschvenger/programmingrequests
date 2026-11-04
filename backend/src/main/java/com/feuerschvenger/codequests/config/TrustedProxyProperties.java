package com.feuerschvenger.codequests.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * The proxy trust setting that decides whether {@code X-Forwarded-For} is believed.
 * <p>
 * Tomcat's remote IP valve falls back to its own built-in pattern, which trusts every private address range, when the internal proxies expression is blank. A blank value would therefore widen the trust silently instead of narrowing it, so the application refuses to start when the expression is missing or blank.
 * </p>
 *
 * @param internalProxies value of {@code server.tomcat.remoteip.internal-proxies} ({@code TRUSTED_PROXIES}), a regular expression matched against the connecting address
 */
@ConfigurationProperties(prefix = "server.tomcat.remoteip")
public record TrustedProxyProperties(String internalProxies) {

    /**
     * Rejects a missing or blank expression.
     */
    public TrustedProxyProperties {
        if (internalProxies == null || internalProxies.isBlank()) {
            throw new IllegalArgumentException("TRUSTED_PROXIES (server.tomcat.remoteip.internal-proxies) must not be blank. "
                    + "Set a regular expression that matches only the proxy in front of the API, for example 127\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}");
        }
    }
}
