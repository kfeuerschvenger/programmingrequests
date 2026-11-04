package com.feuerschvenger.codequests.security;

import com.feuerschvenger.codequests.config.VoterProperties;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("VoterHasher")
class VoterHasherTest {

    private static final String SECRET_A = "secret-a-secret-a-secret-a-secret-a-1234";
    private static final String SECRET_B = "secret-b-secret-b-secret-b-secret-b-5678";

    private final VoterHasher hasher = new VoterHasher(new VoterProperties(SECRET_A));

    @Test
    @DisplayName("returns the same 32 bytes for the same address")
    void isDeterministic() {
        assertThat(hasher.hash("203.0.113.9")).hasSize(32).isEqualTo(hasher.hash("203.0.113.9"));
    }

    @Test
    @DisplayName("returns different values for different addresses")
    void differsPerAddress() {
        assertThat(hasher.hash("203.0.113.9")).isNotEqualTo(hasher.hash("203.0.113.10"));
    }

    @Test
    @DisplayName("returns different values for different secrets")
    void differsPerSecret() {
        var other = new VoterHasher(new VoterProperties(SECRET_B));

        assertThat(hasher.hash("203.0.113.9")).isNotEqualTo(other.hash("203.0.113.9"));
    }

    @Test
    @DisplayName("never contains the address, in raw or hex form")
    void doesNotLeakTheAddress() {
        var address = "203.0.113.9";
        var hash = hasher.hash(address);

        assertThat(new String(hash, StandardCharsets.ISO_8859_1)).doesNotContain(address);
        assertThat(hasher.hashHex(address)).doesNotContain(address).isEqualTo(HexFormat.of().formatHex(hash)).hasSize(64);
    }

    @Test
    @DisplayName("returns the same value when many threads hash at once")
    void isThreadSafe() throws Exception {
        var expected = hasher.hash("203.0.113.9");
        try (var pool = java.util.concurrent.Executors.newFixedThreadPool(8)) {
            var results = new java.util.ArrayList<java.util.concurrent.Future<byte[]>>();
            for (var i = 0; i < 400; i++) {
                results.add(pool.submit(() -> hasher.hash("203.0.113.9")));
            }
            for (var result : results) {
                assertThat(result.get()).isEqualTo(expected);
            }
        }
    }

    @Test
    @DisplayName("is the HMAC-SHA256 of the address under the secret")
    void isHmacSha256() throws Exception {
        var mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(SECRET_A.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));

        assertThat(hasher.hash("203.0.113.9")).isEqualTo(mac.doFinal("203.0.113.9".getBytes(StandardCharsets.UTF_8)));
    }
}
