package com.feuerschvenger.codequests.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.context.properties.bind.BindException;
import org.springframework.boot.context.properties.source.MapConfigurationPropertySource;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("VoterProperties")
class VoterPropertiesTest {

    @Test
    @DisplayName("accepts a secret of 32 bytes")
    void acceptsMinimumLength() {
        var properties = new VoterProperties("x".repeat(32));

        assertThat(properties.hashSecret()).hasSize(32);
    }

    @Test
    @DisplayName("rejects a missing secret with a message that says how to create one")
    void rejectsMissing() {
        assertThatThrownBy(() -> new VoterProperties(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("VOTER_HASH_SECRET is required")
                .hasMessageContaining("openssl rand -base64 48");
    }

    @Test
    @DisplayName("rejects a blank secret")
    void rejectsBlank() {
        assertThatThrownBy(() -> new VoterProperties("   ")).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("rejects a secret shorter than 32 bytes")
    void rejectsShort() {
        assertThatThrownBy(() -> new VoterProperties("x".repeat(31)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("at least 32 bytes");
    }

    @Test
    @DisplayName("counts bytes rather than characters")
    void countsBytes() {
        // 16 two-byte characters are 32 bytes in UTF-8, so they pass although they are only 16 characters.
        assertThat(new VoterProperties("é".repeat(16)).hashSecret()).hasSize(16);
    }

    @Test
    @DisplayName("does not print the secret")
    void redactsToString() {
        assertThat(new VoterProperties("x".repeat(40)).toString()).doesNotContain("xxxx");
    }

    @Test
    @DisplayName("fails the binding at startup when the property is empty")
    void failsBindingWhenEmpty() {
        var binder = new Binder(new MapConfigurationPropertySource(Map.of("app.voter.hash-secret", "")));

        assertThatThrownBy(() -> binder.bind("app.voter", VoterProperties.class).get()).isInstanceOf(BindException.class);
    }
}
