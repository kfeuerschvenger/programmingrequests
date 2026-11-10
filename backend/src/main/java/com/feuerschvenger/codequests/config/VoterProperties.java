package com.feuerschvenger.codequests.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.nio.charset.StandardCharsets;

/**
 * Voter identity settings.
 * <p>
 * The hash secret keys the HMAC that turns a client address into a voter id. It has no default: the application refuses to start when it is missing or shorter than 32 bytes, because a weak or shared key would let anyone with a database dump recover addresses by brute force.
 * </p>
 *
 * @param hashSecret value of {@code VOTER_HASH_SECRET}, at least 32 bytes in UTF-8
 */
@ConfigurationProperties(prefix = "app.voter")
public record VoterProperties(String hashSecret) {

    /** Minimum secret length in bytes. */
    public static final int MIN_SECRET_BYTES = 32;

    /**
     * Rejects a missing or short secret.
     */
    public VoterProperties {
        if (hashSecret == null || hashSecret.isBlank()) {
            throw new IllegalArgumentException("VOTER_HASH_SECRET is required. Generate one with: openssl rand -base64 48");
        }
        if (hashSecret.getBytes(StandardCharsets.UTF_8).length < MIN_SECRET_BYTES) {
            throw new IllegalArgumentException("VOTER_HASH_SECRET must be at least " + MIN_SECRET_BYTES + " bytes long. Generate one with: openssl rand -base64 48");
        }
    }

    /** Redacts the secret, so the settings can be logged or printed safely. */
    @Override
    public String toString() {
        return "VoterProperties[hashSecret=***]";
    }
}
