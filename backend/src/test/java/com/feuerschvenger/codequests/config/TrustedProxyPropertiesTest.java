package com.feuerschvenger.codequests.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("TrustedProxyProperties")
class TrustedProxyPropertiesTest {

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withUserConfiguration(Registration.class);

    @EnableConfigurationProperties(TrustedProxyProperties.class)
    static class Registration {
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {" ", "   \t"})
    @DisplayName("rejects a missing or blank expression with a message that names the setting")
    void rejectsBlank(String value) {
        assertThatThrownBy(() -> new TrustedProxyProperties(value))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("TRUSTED_PROXIES");
    }

    @Test
    @DisplayName("keeps a configured expression")
    void keepsExpression() {
        assertThat(new TrustedProxyProperties("10\\.0\\.0\\.1").internalProxies()).isEqualTo("10\\.0\\.0\\.1");
    }

    @Test
    @DisplayName("stops the context from starting when the Tomcat setting is blank")
    void blankSettingFailsStartup() {
        runner.withPropertyValues("server.tomcat.remoteip.internal-proxies=").run(context -> {
            assertThat(context).hasFailed();
            assertThat(context.getStartupFailure()).hasStackTraceContaining("TRUSTED_PROXIES");
        });
    }

    @Test
    @DisplayName("starts when the Tomcat setting has a value")
    void validSettingStarts() {
        runner.withPropertyValues("server.tomcat.remoteip.internal-proxies=127\\.0\\.0\\.1").run(context ->
                assertThat(context.getBean(TrustedProxyProperties.class).internalProxies()).isEqualTo("127\\.0\\.0\\.1"));
    }
}
