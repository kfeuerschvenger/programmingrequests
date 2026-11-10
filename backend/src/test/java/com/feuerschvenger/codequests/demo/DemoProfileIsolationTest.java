package com.feuerschvenger.codequests.demo;

import com.feuerschvenger.codequests.support.MySqlIntegrationSupport;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Starts the application without the {@code demo} profile, the way every normal stack runs, and proves the seeder is not part of it.
 */
@SpringBootTest
@DisplayName("Without the demo profile")
class DemoProfileIsolationTest extends MySqlIntegrationSupport {

    @Autowired
    private ApplicationContext context;

    @Test
    @DisplayName("no DemoDataSeeder bean exists, so nothing can wipe the data at startup")
    void seederIsAbsent() {
        assertThat(context.getBeansOfType(DemoDataSeeder.class)).isEmpty();
    }
}
