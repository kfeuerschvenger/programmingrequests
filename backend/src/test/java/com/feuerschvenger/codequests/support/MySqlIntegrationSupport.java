package com.feuerschvenger.codequests.support;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.mysql.MySQLContainer;

/**
 * Starts one MySQL container for the whole test JVM and points the datasource at it.
 * <p>
 * Starting a container per test class would dominate the build time. The container is stopped by Testcontainers when the JVM exits. Flyway runs the real migrations against it, so every test sees the production schema.
 * </p>
 */
public abstract class MySqlIntegrationSupport {

    private static final MySQLContainer MYSQL = new MySQLContainer("mysql:8.4.13");

    static {
        MYSQL.start();
    }

    /**
     * The JDBC URL of the container with the host spelled {@code localhost}.
     * <p>
     * Testcontainers reports the host of the Docker daemon, which is not {@code localhost} when the daemon is remote. Tests that depend on the host name, such as the demo seeder's guard, register this URL instead.
     * </p>
     *
     * @return a URL for the same database as {@code getJdbcUrl()}, reached through {@code localhost}
     */
    protected static String localhostJdbcUrl() {
        return "jdbc:mysql://localhost:" + MYSQL.getMappedPort(3306) + "/" + MYSQL.getDatabaseName();
    }

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", MYSQL::getJdbcUrl);
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
    }
}
