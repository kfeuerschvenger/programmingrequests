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
 * When the connecting address is not a trusted proxy, {@code X-Forwarded-For} must be ignored, otherwise any client could pick its own voter identity.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = "server.tomcat.remoteip.internal-proxies=192\\.0\\.2\\.1")
@DisplayName("X-Forwarded-For from an untrusted connection")
class UntrustedProxyIntegrationTest extends MySqlIntegrationSupport {

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
    @DisplayName("keeps one voter identity whatever the header says")
    void ignoresForwardedFor() {
        var id = api.post("/api/ideas", "{\"description\":\"Forge a CLI that slays merge conflicts\"}", "198.51.100.1")
                .body().get("id").asLong();

        api.put("/api/ideas/" + id + "/vote", "{\"value\":1}", "198.51.100.1");
        var asOther = api.get("/api/ideas/" + id, "198.51.100.2").body();

        assertThat(asOther.get("myVote").asInt()).isEqualTo(1);
        var stored = jdbc.queryForObject("SELECT voter_hash FROM votes WHERE idea_id = ?", byte[].class, id);
        assertThat(stored).isEqualTo(hasher.hash("127.0.0.1")).isNotEqualTo(hasher.hash("198.51.100.1"));
    }
}
