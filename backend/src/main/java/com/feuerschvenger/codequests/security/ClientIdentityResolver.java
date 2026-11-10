package com.feuerschvenger.codequests.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

import java.util.HexFormat;

/**
 * Resolves who is calling, once per request.
 * <p>
 * The address is {@link HttpServletRequest#getRemoteAddr()}. Tomcat's remote IP valve has already replaced it with the {@code X-Forwarded-For} value when, and only when, the request came from a trusted proxy, so nothing here reads that header. The address is normalised (see {@link ClientAddressNormalizer}), hashed, and the result is cached in a request attribute, so the rate limiter and the vote logic share one HMAC computation and always agree on the identity.
 * </p>
 */
@Component
public class ClientIdentityResolver {

    private static final String ATTRIBUTE = ClientIdentityResolver.class.getName() + ".IDENTITY";

    private final VoterHasher hasher;

    /**
     * Creates the resolver.
     *
     * @param hasher computes the voter hash
     */
    public ClientIdentityResolver(VoterHasher hasher) {
        this.hasher = hasher;
    }

    /**
     * Returns the identity of the caller, computing it on the first call for a request.
     *
     * @param request the current request
     */
    public ClientIdentity resolve(HttpServletRequest request) {
        if (request.getAttribute(ATTRIBUTE) instanceof ClientIdentity cached) {
            return cached;
        }
        var hash = hasher.hash(ClientAddressNormalizer.normalize(request.getRemoteAddr()));
        var identity = new ClientIdentity(hash, HexFormat.of().formatHex(hash));
        request.setAttribute(ATTRIBUTE, identity);
        return identity;
    }
}
