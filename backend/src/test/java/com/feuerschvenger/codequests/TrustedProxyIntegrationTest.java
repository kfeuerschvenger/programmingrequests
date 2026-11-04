package com.feuerschvenger.codequests;

import com.feuerschvenger.codequests.security.VoterHasher;
import com.feuerschvenger.codequests.support.ApiTestClient;
import com.feuerschvenger.codequests.support.MySqlIntegrationSupport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The test client connects from 127.0.0.1, which is configured here as the trusted proxy, and sends an {@code X-Forwarded-For} chain whose leftmost entry is forged. Tomcat walks the chain from the right and stops at the first address that is not a trusted proxy, so the forged leftmost value never becomes the client address.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {"server.tomcat.remoteip.internal-proxies=127\\.0\\.0\\.1", "app.rate-limit.create.capacity=2"})
@DisplayName("X-Forwarded-For from a trusted proxy")
class TrustedProxyIntegrationTest extends MySqlIntegrationSupport {

    private static final String DESCRIPTION = "Forge a CLI that slays merge conflicts";
    // Each test uses its own client address, because the rate limit state is shared by the tests of one context.
    private static final String VOTER_CLIENT = "198.51.100.7";
    private static final String LIMITED_CLIENT = "198.51.100.20";

    @LocalServerPort
    private int port;

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private VoterHasher hasher;

    private ApiTestClient api;

    @BeforeEach
    void setUp() {
        api = new ApiTestClient(port);
        jdbc.update("DELETE FROM votes");
        jdbc.update("DELETE FROM ideas");
    }

    @Test
    @DisplayName("ignores a forged leftmost entry and hashes the address the proxy appended")
    void voterHashUsesTheRightmostUntrustedAddress() {
        var id = api.post("/api/ideas", "{\"description\":\"" + DESCRIPTION + "\"}", "203.0.113.50, " + VOTER_CLIENT)
                .body().get("id").asLong();

        api.put("/api/ideas/" + id + "/vote", "{\"value\":1}", "203.0.113.51, " + VOTER_CLIENT);

        var stored = jdbc.queryForObject("SELECT voter_hash FROM votes WHERE idea_id = ?", byte[].class, id);
        assertThat(stored).isEqualTo(hasher.hash(VOTER_CLIENT)).isNotEqualTo(hasher.hash("203.0.113.51"));
        assertThat(api.get("/api/ideas/" + id, "203.0.113.52, " + VOTER_CLIENT).body().get("myVote").asInt()).isEqualTo(1);
        assertThat(api.get("/api/ideas/" + id, "203.0.113.51").body().get("myVote").asInt()).isZero();
    }

    @Test
    @DisplayName("keys the rate limit on the resolved address, so rotating the forged entry buys no extra calls")
    void rateLimitKeyUsesTheRightmostUntrustedAddress() {
        var body = "{\"description\":\"" + DESCRIPTION + "\"}";

        assertThat(api.post("/api/ideas", body, "203.0.113.60, " + LIMITED_CLIENT).status()).isEqualTo(201);
        assertThat(api.post("/api/ideas", body, "203.0.113.61, " + LIMITED_CLIENT).status()).isEqualTo(201);

        assertThat(api.post("/api/ideas", body, "203.0.113.62, " + LIMITED_CLIENT).status()).isEqualTo(429);
        assertThat(api.post("/api/ideas", body, "203.0.113.60, 198.51.100.8").status()).isEqualTo(201);
    }
}
