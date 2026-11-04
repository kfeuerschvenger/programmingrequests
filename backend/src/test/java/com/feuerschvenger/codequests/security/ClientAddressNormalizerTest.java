package com.feuerschvenger.codequests.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("ClientAddressNormalizer")
class ClientAddressNormalizerTest {

    @ParameterizedTest
    @CsvSource({"203.0.113.9", "127.0.0.1", "10.1.2.3"})
    @DisplayName("keeps an IPv4 address unchanged")
    void keepsIpv4(String address) {
        assertThat(ClientAddressNormalizer.normalize(address)).isEqualTo(address);
    }

    @ParameterizedTest
    @CsvSource({
            "2001:db8:1:2:3:4:5:6, 2001:db8:1:2:0:0:0:0/64",
            "2001:db8:1:2:ffff:ffff:ffff:ffff, 2001:db8:1:2:0:0:0:0/64",
            "2001:db8::1, 2001:db8:0:0:0:0:0:0/64",
            "2001:DB8:0:0:0:0:0:1, 2001:db8:0:0:0:0:0:0/64",
            "fe80::1%eth0, fe80:0:0:0:0:0:0:0/64",
            "::1, 0:0:0:0:0:0:0:0/64"
    })
    @DisplayName("reduces an IPv6 address to its /64 prefix")
    void reducesIpv6ToPrefix(String address, String expected) {
        assertThat(ClientAddressNormalizer.normalize(address)).isEqualTo(expected);
    }

    @Test
    @DisplayName("gives every address inside one /64 the same value and different prefixes different values")
    void groupsByPrefix() {
        assertThat(ClientAddressNormalizer.normalize("2001:db8:1:2:aaaa:bbbb:cccc:dddd"))
                .isEqualTo(ClientAddressNormalizer.normalize("2001:db8:1:2::1"))
                .isNotEqualTo(ClientAddressNormalizer.normalize("2001:db8:1:3::1"));
    }

    @ParameterizedTest
    @CsvSource({
            "::ffff:203.0.113.9, 203.0.113.9",
            "0:0:0:0:0:ffff:cb00:7109, 203.0.113.9",
            "::FFFF:10.0.0.1, 10.0.0.1"
    })
    @DisplayName("converts an IPv4-mapped IPv6 address to IPv4")
    void convertsMappedAddress(String address, String expected) {
        assertThat(ClientAddressNormalizer.normalize(address)).isEqualTo(expected);
    }

    @Test
    @DisplayName("returns an empty string for null and leaves text that is not an IPv6 literal alone")
    void handlesOddInput() {
        assertThat(ClientAddressNormalizer.normalize(null)).isEmpty();
        assertThat(ClientAddressNormalizer.normalize("not-an-address")).isEqualTo("not-an-address");
        assertThat(ClientAddressNormalizer.normalize("host.example:8080")).isEqualTo("host.example:8080");
        assertThat(ClientAddressNormalizer.normalize("1:2:3:4:5:6:7:8:9")).isEqualTo("1:2:3:4:5:6:7:8:9");
    }
}
