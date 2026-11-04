package com.feuerschvenger.codequests.security;

import com.feuerschvenger.codequests.config.VoterProperties;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import java.util.HexFormat;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@DisplayName("ClientIdentityResolver")
class ClientIdentityResolverTest {

    private final VoterHasher hasher = spy(new VoterHasher(new VoterProperties("resolver-secret-resolver-secret-0123")));
    private final ClientIdentityResolver resolver = new ClientIdentityResolver(hasher);

    private static MockHttpServletRequest requestFrom(String address) {
        var request = new MockHttpServletRequest("GET", "/api/ideas");
        request.setRemoteAddr(address);
        return request;
    }

    @Test
    @DisplayName("hashes the address and exposes the same hash as hex")
    void hashesAddress() {
        var identity = resolver.resolve(requestFrom("203.0.113.9"));

        assertThat(identity.voterHash()).isEqualTo(hasher.hash("203.0.113.9"));
        assertThat(identity.key()).isEqualTo(HexFormat.of().formatHex(identity.voterHash())).doesNotContain("203.0.113.9");
    }

    @Test
    @DisplayName("computes the HMAC once per request however often the identity is read")
    void hashesOncePerRequest() {
        var request = requestFrom("203.0.113.9");

        var first = resolver.resolve(request);
        var second = resolver.resolve(request);

        assertThat(second).isSameAs(first);
        verify(hasher, times(1)).hash("203.0.113.9");
    }

    @Test
    @DisplayName("does not share an identity between requests")
    void isPerRequest() {
        var first = resolver.resolve(requestFrom("203.0.113.9"));
        var second = resolver.resolve(requestFrom("203.0.113.10"));

        assertThat(second.key()).isNotEqualTo(first.key());
    }

    @Test
    @DisplayName("gives the callers inside one IPv6 /64 the same identity")
    void groupsIpv6ByPrefix() {
        var first = resolver.resolve(requestFrom("2001:db8:1:2:aaaa:bbbb:cccc:dddd"));
        var second = resolver.resolve(requestFrom("2001:db8:1:2::1"));
        var other = resolver.resolve(requestFrom("2001:db8:1:3::1"));

        assertThat(second.key()).isEqualTo(first.key());
        assertThat(other.key()).isNotEqualTo(first.key());
    }

    @Test
    @DisplayName("gives an IPv4-mapped IPv6 caller the identity of the IPv4 address")
    void mappedAddressMatchesIpv4() {
        var mapped = resolver.resolve(requestFrom("::ffff:203.0.113.9"));
        var plain = resolver.resolve(requestFrom("203.0.113.9"));

        assertThat(mapped.key()).isEqualTo(plain.key());
    }
}
