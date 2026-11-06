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

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", MYSQL::getJdbcUrl);
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
    }
}
