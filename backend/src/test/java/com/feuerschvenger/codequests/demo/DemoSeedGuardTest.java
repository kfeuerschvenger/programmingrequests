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
            "jdbc:mysql://localhost/code_quests",
            "JDBC:MYSQL://[::1]:3306/CODE_QUESTS",
            "jdbc:mysql://[::1]/code_quests",
            // User information before the host is credentials: the host the driver connects to is the one after the at sign.
            "jdbc:mysql://user:pw@localhost:3306/code_quests"
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
            "jdbc:mysql://evil.example.com/code_quests?HOST=localhost",
            "jdbc:mysql://localhost/code_quests?HOST=evil",
            "jdbc:mysql:replication://localhost,evil/db",
            "jdbc:mysql://localhost:3306,evil.com/db",
            // A trailing dot is a different spelling, refused rather than normalized.
            "jdbc:mysql://localhost./code_quests",
            // Only the compressed form of the IPv6 loopback is listed.
            "jdbc:mysql://[0:0:0:0:0:0:0:1]/code_quests",
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
    @DisplayName("never prints the user information of an accepted or refused URL")
    void messageNeverPrintsUserInformation() {
        assertThatThrownBy(() -> DemoSeedGuard.requireLocalDatabase("jdbc:mysql://admin:hunter2@prod-db.example.com/code_quests"))
                .hasMessageContaining("prod-db.example.com")
                .hasMessageNotContaining("hunter2")
                .hasMessageNotContaining("admin");
    }

    @Test
    @DisplayName("accepts only the exact confirmation")
    void acceptsExactConfirmation() {
        assertThatCode(() -> DemoSeedGuard.requireConfirmation("wipe")).doesNotThrowAnyException();
    }

    @ParameterizedTest(name = "refuses the confirmation \"{0}\"")
    @NullAndEmptySource
    @ValueSource(strings = {"WIPE", "yes", "true", " wipe", "wipe ", "wipe!"})
    @DisplayName("refuses a missing or different confirmation, and the message names the way out")
    void refusesOtherConfirmations(String confirmation) {
        assertThatThrownBy(() -> DemoSeedGuard.requireConfirmation(confirmation))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("DEMO_SEED_CONFIRM=wipe")
                .hasMessageContaining("Nothing was deleted");
    }

    @Test
    @DisplayName("lowercases the host it reports")
    void hostIsLowerCase() {
        assertThat(DemoSeedGuard.hostOf("jdbc:mysql://DB:3306/x")).isEqualTo("db");
    }
}
