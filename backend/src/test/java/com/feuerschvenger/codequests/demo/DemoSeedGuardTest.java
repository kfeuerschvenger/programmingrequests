package com.feuerschvenger.codequests.demo;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("DemoSeedGuard")
class DemoSeedGuardTest {

    @ParameterizedTest(name = "accepts {0}")
    @ValueSource(strings = {
            "jdbc:mysql://localhost:3307/code_quests",
            "jdbc:mysql://127.0.0.1:3306/code_quests?useSSL=false",
            "jdbc:mysql://db:3306/code_quests",
            "jdbc:mysql://[::1]:3306/code_quests",
            "JDBC:MYSQL://LOCALHOST/code_quests",
            "jdbc:mysql://localhost/code_quests"
    })
    @DisplayName("accepts the hosts of a local stack")
    void acceptsLocalHosts(String url) {
        assertThatCode(() -> DemoSeedGuard.requireLocalDatabase(url)).doesNotThrowAnyException();
    }

    @ParameterizedTest(name = "rejects {0}")
    @ValueSource(strings = {
            "jdbc:mysql://prod-db.example.com:3306/code_quests",
            "jdbc:mysql://10.0.0.5:3306/code_quests",
            "jdbc:mysql://localhost.example.com:3306/code_quests",
            "jdbc:mysql://notlocalhost/code_quests",
            "jdbc:mysql://database/code_quests",
            "jdbc:mysql://localhost@evil.example.com/code_quests",
            "jdbc:mysql://localhost,evil.example.com/code_quests",
            "jdbc:mysql://evil.example.com/code_quests?host=localhost",
            "jdbc:mysql:///code_quests",
            "jdbc:mysql://address=(host=evil.example.com)(port=3306)/code_quests",
            "mysql://localhost/code_quests",
            "not a url"
    })
    @DisplayName("rejects every other host and anything it cannot parse with certainty")
    void rejectsOtherHosts(String url) {
        assertThatThrownBy(() -> DemoSeedGuard.requireLocalDatabase(url))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("demo profile");
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = "   ")
    @DisplayName("rejects a missing URL")
    void rejectsBlank(String url) {
        assertThatThrownBy(() -> DemoSeedGuard.requireLocalDatabase(url))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("cannot be determined");
    }

    @Test
    @DisplayName("names the refused host in the message and never the credentials or the database")
    void messageNamesTheHost() {
        assertThatThrownBy(() -> DemoSeedGuard.requireLocalDatabase("jdbc:mysql://prod-db.example.com:3306/secret_db?password=hunter2"))
                .hasMessageContaining("prod-db.example.com")
                .hasMessageNotContaining("hunter2")
                .hasMessageNotContaining("secret_db");
    }

    @Test
    @DisplayName("lowercases the host it reports")
    void hostIsLowerCase() {
        assertThat(DemoSeedGuard.hostOf("jdbc:mysql://DB:3306/x")).isEqualTo("db");
    }
}
