package com.feuerschvenger.codequests;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.jdbc.core.JdbcTemplate;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.mysql.MySQLContainer;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Wiring test: boots the full context against a real MySQL, so Flyway runs the baseline and Hibernate validates the entities against the migrated schema ({@code ddl-auto=validate}).
 */
@SpringBootTest
@Testcontainers
@DisplayName("Application wiring")
class CodeQuestsApplicationTests {

    @Container
    @ServiceConnection
    static final MySQLContainer MYSQL = new MySQLContainer("mysql:8.4");

    @Autowired
    private Flyway flyway;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("starts the context with the schema validated")
    void contextLoads() {
        assertThat(flyway.info().current()).isNotNull();
        assertThat(flyway.info().current().getVersion().getVersion()).isEqualTo("1");
    }

    @Test
    @DisplayName("creates the ideas and votes tables")
    void createsBaselineTables() {
        var tables = jdbcTemplate.queryForList(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name IN ('ideas', 'votes')",
                String.class);

        assertThat(tables).containsExactlyInAnyOrder("ideas", "votes");
    }
}
