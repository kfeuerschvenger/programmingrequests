package com.feuerschvenger.codequests;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.testcontainers.mysql.MySQLContainer;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Migrates a populated V1 schema to the latest version on a real MySQL. It runs on its own container because it needs a schema that stops at V1, which the shared test database never is.
 */
@DisplayName("Flyway upgrade from V1 on populated data")
class FlywayUpgradeFromV1IntegrationTest {

    private static final MySQLContainer MYSQL = new MySQLContainer("mysql:8.4");

    private static JdbcTemplate jdbc;
    private static Flyway flyway;

    @BeforeAll
    static void migrateToV1AndPopulate() {
        MYSQL.start();
        var dataSource = new DriverManagerDataSource(MYSQL.getJdbcUrl(), MYSQL.getUsername(), MYSQL.getPassword());
        jdbc = new JdbcTemplate(dataSource);

        Flyway.configure().dataSource(dataSource).locations("classpath:db/migration").target("1").load().migrate();

        // V1 shape: ideas(author, date, description, up_votes) and votes(ip_address, value, idea_id).
        jdbc.update("INSERT INTO ideas (author, date, description, up_votes) VALUES (?, ?, ?, ?)",
                "Ada", "2024-01-02 03:04:05.123456", "A complete legacy idea with a date", 7);
        jdbc.update("INSERT INTO ideas (author, date, description, up_votes) VALUES (?, NULL, NULL, ?)", "   ", 3);
        jdbc.update("INSERT INTO ideas (author, date, description, up_votes) VALUES (?, ?, ?, ?)",
                "  " + "x".repeat(100) + "  ", "2024-02-03 04:05:06.000000", "y".repeat(250), -2);
        var firstId = jdbc.queryForObject("SELECT MIN(id) FROM ideas", Long.class);
        jdbc.update("INSERT INTO votes (ip_address, value, idea_id) VALUES ('203.0.113.9', 1, ?)", firstId);
        jdbc.update("INSERT INTO votes (ip_address, value, idea_id) VALUES ('203.0.113.10', 1, ?)", firstId);
        jdbc.update("INSERT INTO votes (ip_address, value, idea_id) VALUES ('203.0.113.11', -1, NULL)");

        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM ideas", Integer.class)).isEqualTo(3);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM votes", Integer.class)).isEqualTo(3);

        flyway = Flyway.configure().dataSource(dataSource).locations("classpath:db/migration").load();
        flyway.migrate();
    }

    @AfterAll
    static void stop() {
        MYSQL.stop();
    }

    private static List<String> columns(String table) {
        return jdbc.queryForList(
                "SELECT column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ?",
                String.class, table);
    }

    @Test
    @DisplayName("applies V2 without failures")
    void migrates() {
        var current = flyway.info().current();

        assertThat(current).isNotNull();
        assertThat(current.getVersion().getVersion()).isEqualTo("2");
        assertThat(flyway.info().pending()).isEmpty();
    }

    @Test
    @DisplayName("keeps every idea and renames its columns")
    void keepsIdeasWithRenamedColumns() {
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM ideas", Integer.class)).isEqualTo(3);
        assertThat(columns("ideas")).contains("created_at", "score").doesNotContain("date", "up_votes");
    }

    @Test
    @DisplayName("normalises legacy values so the stricter columns hold")
    void normalisesLegacyRows() {
        var rows = jdbc.queryForList("SELECT author, description, created_at FROM ideas ORDER BY id");

        assertThat(rows.get(0).get("author")).isEqualTo("Ada");
        assertThat(rows.get(0).get("description")).isEqualTo("A complete legacy idea with a date");
        assertThat(rows.get(0).get("created_at").toString()).startsWith("2024-01-02");

        assertThat(rows.get(1).get("author")).isNull();
        assertThat(rows.get(1).get("description")).isEqualTo("");
        assertThat(rows.get(1).get("created_at")).isNotNull();

        assertThat((String) rows.get(2).get("author")).isEqualTo("x".repeat(60));
        assertThat((String) rows.get(2).get("description")).hasSize(250);
    }

    @Test
    @DisplayName("clears the votes and resets every score to zero")
    void clearsVotesAndResetsScores() {
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM votes", Integer.class)).isZero();
        assertThat(jdbc.queryForList("SELECT DISTINCT score FROM ideas", Integer.class)).containsExactly(0);
    }

    @Test
    @DisplayName("replaces the address column with a voter hash that is unique per idea and removed with the idea")
    void votesUseVoterHash() {
        assertThat(columns("votes")).contains("voter_hash", "created_at", "updated_at").doesNotContain("ip_address");

        var ideaId = jdbc.queryForObject("SELECT MIN(id) FROM ideas", Long.class);
        var hash = new byte[32];
        jdbc.update("INSERT INTO votes (voter_hash, value, idea_id) VALUES (?, 1, ?)", hash, ideaId);
        try {
            org.assertj.core.api.Assertions.assertThatThrownBy(
                            () -> jdbc.update("INSERT INTO votes (voter_hash, value, idea_id) VALUES (?, -1, ?)", hash, ideaId))
                    .hasMessageContaining("uq_votes_idea_voter");
        } finally {
            jdbc.update("DELETE FROM votes");
        }
    }
}
