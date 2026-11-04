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
 * End-to-end contract test against the embedded server and a real MySQL: validation, problem responses, vote identity from {@code X-Forwarded-For} sent by a trusted proxy, and rate limiting.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = "app.rate-limit.create.capacity=3")
@DisplayName("Ideas API end to end")
class IdeasApiIntegrationTest extends MySqlIntegrationSupport {

    private static final String DESCRIPTION = "Forge a CLI that slays merge conflicts";
    private static final String ALICE = "198.51.100.10";
    private static final String BOB = "198.51.100.11";

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

    private long createIdea(String forwardedFor) {
        var reply = api.post("/api/ideas", "{\"author\":\"Ada\",\"description\":\"" + DESCRIPTION + "\"}", forwardedFor);
        assertThat(reply.status()).isEqualTo(201);
        return reply.body().get("id").asLong();
    }

    @Test
    @DisplayName("creates an idea with server-side score and date and ignores client-sent ones")
    void create() {
        var reply = api.post("/api/ideas",
                "{\"author\":\"  Ada  \",\"description\":\"  " + DESCRIPTION + "  \",\"score\":999,\"upVotes\":999,\"createdAt\":\"1999-01-01T00:00:00Z\"}",
                "203.0.113.1");

        assertThat(reply.status()).isEqualTo(201);
        var id = reply.body().get("id").asLong();
        assertThat(reply.header("Location")).isEqualTo("/api/ideas/" + id);
        assertThat(reply.body().get("author").asString()).isEqualTo("Ada");
        assertThat(reply.body().get("description").asString()).isEqualTo(DESCRIPTION);
        assertThat(reply.body().get("score").asInt()).isZero();
        assertThat(reply.body().get("myVote").asInt()).isZero();
        assertThat(reply.body().get("createdAt").asString()).matches("20\\d\\d-\\d\\d-\\d\\dT\\d\\d:\\d\\d:\\d\\d(\\.\\d+)?Z").doesNotStartWith("1999");

        var fetched = api.get("/api/ideas/" + id, "203.0.113.1");
        assertThat(fetched.status()).isEqualTo(200);
        assertThat(fetched.body().get("createdAt")).isEqualTo(reply.body().get("createdAt"));
    }

    @Test
    @DisplayName("stores a blank author as null and accepts an anonymous idea")
    void anonymous() {
        var reply = api.post("/api/ideas", "{\"author\":\"   \",\"description\":\"" + DESCRIPTION + "\"}", "203.0.113.2");

        assertThat(reply.status()).isEqualTo(201);
        assertThat(reply.body().get("author").isNull()).isTrue();
    }

    @Test
    @DisplayName("tells voters apart by the forwarded address and keeps the vote idempotent")
    void votes() {
        var id = createIdea("203.0.113.3");

        var up = api.put("/api/ideas/" + id + "/vote", "{\"value\":1}", ALICE);
        assertThat(up.status()).isEqualTo(200);
        assertThat(up.body().get("score").asInt()).isEqualTo(1);
        assertThat(up.body().get("myVote").asInt()).isEqualTo(1);

        assertThat(api.get("/api/ideas/" + id, ALICE).body().get("myVote").asInt()).isEqualTo(1);
        var asBob = api.get("/api/ideas/" + id, BOB).body();
        assertThat(asBob.get("myVote").asInt()).isZero();
        assertThat(asBob.get("score").asInt()).isEqualTo(1);

        assertThat(api.put("/api/ideas/" + id + "/vote", "{\"value\":1}", ALICE).body().get("score").asInt()).isEqualTo(1);

        var down = api.put("/api/ideas/" + id + "/vote", "{\"value\":-1}", ALICE).body();
        assertThat(down.get("score").asInt()).isEqualTo(-1);
        assertThat(down.get("myVote").asInt()).isEqualTo(-1);

        var withdrawn = api.delete("/api/ideas/" + id + "/vote", ALICE);
        assertThat(withdrawn.status()).isEqualTo(200);
        assertThat(withdrawn.body().get("score").asInt()).isZero();
        assertThat(withdrawn.body().get("myVote").asInt()).isZero();
        assertThat(api.delete("/api/ideas/" + id + "/vote", ALICE).body().get("score").asInt()).isZero();
    }

    @Test
    @DisplayName("stores only the HMAC of the forwarded address and ignores an address in the body")
    void storesOnlyTheHash() {
        var id = createIdea("203.0.113.4");

        api.put("/api/ideas/" + id + "/vote", "{\"value\":1,\"ipAddress\":\"203.0.113.77\"}", ALICE);

        var stored = jdbc.queryForObject("SELECT voter_hash FROM votes WHERE idea_id = ?", byte[].class, id);
        assertThat(stored).isEqualTo(hasher.hash(ALICE)).isNotEqualTo(hasher.hash("203.0.113.77"));
        assertThat(api.get("/api/ideas/" + id, "203.0.113.77").body().get("myVote").asInt()).isZero();
    }

    @Test
    @DisplayName("lists a page with the caller's votes, sorted by score")
    void list() {
        var first = createIdea("203.0.113.5");
        var second = createIdea("203.0.113.5");
        createIdea("203.0.113.5");
        api.put("/api/ideas/" + second + "/vote", "{\"value\":1}", ALICE);
        api.put("/api/ideas/" + first + "/vote", "{\"value\":-1}", ALICE);

        var top = api.get("/api/ideas?sort=top&size=2&page=0", ALICE).body();

        assertThat(top.get("totalItems").asInt()).isEqualTo(3);
        assertThat(top.get("totalPages").asInt()).isEqualTo(2);
        assertThat(top.get("size").asInt()).isEqualTo(2);
        assertThat(top.get("items")).hasSize(2);
        assertThat(top.get("items").get(0).get("id").asLong()).isEqualTo(second);
        assertThat(top.get("items").get(0).get("myVote").asInt()).isEqualTo(1);
        assertThat(top.get("items").get(1).get("myVote").asInt()).isZero();

        var oldest = api.get("/api/ideas?sort=oldest", BOB).body();
        assertThat(oldest.get("items").get(0).get("id").asLong()).isEqualTo(first);
        assertThat(oldest.get("items").get(0).get("myVote").asInt()).isZero();
    }

    @Test
    @DisplayName("answers errors with problem details that name fields and never echo input")
    void problems() {
        var notFound = api.get("/api/ideas/999999", "203.0.113.6");
        assertThat(notFound.status()).isEqualTo(404);
        assertThat(notFound.header("Content-Type")).startsWith("application/problem+json");
        assertThat(notFound.body().get("code").asString()).isEqualTo("IDEA_NOT_FOUND");

        var invalid = api.post("/api/ideas", "{\"description\":\"short\"}", "203.0.113.6");
        assertThat(invalid.status()).isEqualTo(400);
        assertThat(invalid.body().get("code").asString()).isEqualTo("VALIDATION_FAILED");
        assertThat(invalid.body().get("errors").get(0).get("field").asString()).isEqualTo("description");
        assertThat(invalid.raw().body()).doesNotContain("short");

        assertThat(api.get("/api/ideas?sort=bogus", "203.0.113.6").status()).isEqualTo(400);
        assertThat(api.get("/api/ideas?size=51", "203.0.113.6").status()).isEqualTo(400);
        assertThat(api.patch("/api/ideas", "203.0.113.6").status()).isEqualTo(405);
        assertThat(api.postText("/api/ideas", "hello", "203.0.113.6").status()).isEqualTo(415);
        assertThat(api.put("/api/ideas/1/vote", "{\"value\":3}", "203.0.113.6").status()).isEqualTo(400);
        assertThat(api.get("/api/nowhere", "203.0.113.6").status()).isEqualTo(404);
    }

    @Test
    @DisplayName("rejects the call over the limit with 429 and Retry-After, per client, and never limits reads")
    void rateLimit() {
        var client = "203.0.113.99";
        for (var i = 0; i < 3; i++) {
            assertThat(api.post("/api/ideas", "{\"description\":\"" + DESCRIPTION + "\"}", client).status()).isEqualTo(201);
        }

        var limited = api.post("/api/ideas", "{\"description\":\"" + DESCRIPTION + "\"}", client);

        assertThat(limited.status()).isEqualTo(429);
        assertThat(limited.header("Retry-After")).matches("\\d+");
        assertThat(Long.parseLong(limited.header("Retry-After"))).isPositive();
        assertThat(limited.body().get("code").asString()).isEqualTo("RATE_LIMITED");
        assertThat(api.post("/api/ideas", "{\"description\":\"" + DESCRIPTION + "\"}", "203.0.113.98").status()).isEqualTo(201);
        assertThat(api.get("/api/ideas", client).status()).isEqualTo(200);
    }

    @Test
    @DisplayName("sends the security headers and the request id on every response")
    void headers() {
        var reply = api.get("/api/ideas", "203.0.113.7");

        assertThat(reply.header("X-Content-Type-Options")).isEqualTo("nosniff");
        assertThat(reply.header("X-Request-Id")).isNotBlank();
        assertThat(reply.header("Cache-Control")).isEqualTo("no-store");
    }
}
