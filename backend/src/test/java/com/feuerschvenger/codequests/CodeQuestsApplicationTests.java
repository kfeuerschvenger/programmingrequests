package com.feuerschvenger.codequests;

import com.feuerschvenger.codequests.support.MySqlIntegrationSupport;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Wiring test: boots the full context against a real MySQL, so Flyway runs the baseline and Hibernate validates the entities against the migrated schema ({@code ddl-auto=validate}).
 */
@SpringBootTest
@DisplayName("Application wiring")
class CodeQuestsApplicationTests extends MySqlIntegrationSupport {

    @Autowired
    private Flyway flyway;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("starts the context with the schema validated")
    void contextLoads() {
        assertThat(flyway.info().current()).isNotNull();
        assertThat(flyway.info().current().getVersion().getVersion()).isEqualTo("2");
    }

    @Test
    @DisplayName("keeps the voter address out of the schema")
    void storesNoRawAddress() {
        var columns = jdbcTemplate.queryForList(
                "SELECT column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'votes'",
                String.class);

        assertThat(columns).contains("voter_hash").doesNotContain("ip_address");
    }

    @Test
    @DisplayName("trusts the private proxy ranges by default")
    void defaultTrustedProxies(@Autowired Environment environment) {
        var pattern = Pattern.compile(environment.getProperty("server.tomcat.remoteip.internal-proxies"));

        assertThat(pattern.matcher("172.18.0.3").matches()).isTrue();
        assertThat(pattern.matcher("203.0.113.9").matches()).isFalse();
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
