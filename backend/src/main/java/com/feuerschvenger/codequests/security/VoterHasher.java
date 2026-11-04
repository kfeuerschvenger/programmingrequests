package com.feuerschvenger.codequests.security;

import com.feuerschvenger.codequests.config.VoterProperties;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.HexFormat;

/**
 * Turns a client address into the opaque voter id that is stored and compared.
 * <p>
 * The id is HMAC-SHA256 of the address keyed by a server secret. It is deterministic for one secret, so the same voter always maps to the same id, and it cannot be reversed or recomputed without the secret. The address itself is never kept.
 * </p>
 */
@Component
public class VoterHasher {

    private static final String ALGORITHM = "HmacSHA256";

    private final SecretKeySpec key;
    private final Mac prototype;

    /**
     * Creates the hasher from the validated secret.
     *
     * @param properties voter settings
     */
    public VoterHasher(VoterProperties properties) {
        this.key = new SecretKeySpec(properties.hashSecret().getBytes(StandardCharsets.UTF_8), ALGORITHM);
        this.prototype = newMac();
    }

    /**
     * Hashes a client address.
     *
     * @param clientAddress address as resolved by the server
     * @return 32 bytes
     */
    public byte[] hash(String clientAddress) {
        return freshMac().doFinal(clientAddress.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Returns an initialised {@link Mac}. Looking up the algorithm and deriving the key schedule cost more than the hash itself, so each call clones a prototype that was initialised once and is never used to compute a hash. The clone is private to the caller, which keeps the hasher safe for concurrent use without a thread-local, and a thread-local would hold one instance per virtual thread.
     */
    private Mac freshMac() {
        try {
            return (Mac) prototype.clone();
        } catch (CloneNotSupportedException e) {
            return newMac();
        }
    }

    private Mac newMac() {
        try {
            var mac = Mac.getInstance(ALGORITHM);
            mac.init(key);
            return mac;
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("HMAC-SHA256 is not available", e);
        }
    }

    /**
     * Hashes a client address and renders it as lower-case hex, for use as an in-memory map key.
     *
     * @param clientAddress address as resolved by the server
     */
    public String hashHex(String clientAddress) {
        return HexFormat.of().formatHex(hash(clientAddress));
    }
}
