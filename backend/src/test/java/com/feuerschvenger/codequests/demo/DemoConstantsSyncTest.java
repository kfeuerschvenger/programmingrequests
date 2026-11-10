package com.feuerschvenger.codequests.demo;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * Keeps the {@code DEMO} constants of {@code e2e/showcase/capture.mjs} equal to {@link DemoQuests}.
 * <p>
 * The capture script asserts on the quest count, the headline and the long quest, so a quest changed here without the script fails every capture run. The test reads the script as text, with a path relative to the backend module, and is skipped when the script is not there, for instance in a build that ships the backend alone.
 * </p>
 */
@DisplayName("Demo constants shared with the capture script")
class DemoConstantsSyncTest {

    private static final Path SCRIPT = Path.of("..", "e2e", "showcase", "capture.mjs");

    private static String script;

    @BeforeAll
    static void readScript() throws IOException {
        assumeTrue(Files.isRegularFile(SCRIPT), "Skipped: " + SCRIPT.toAbsolutePath().normalize() + " is not present, so there is nothing to compare with DemoQuests.");
        script = Files.readString(SCRIPT, StandardCharsets.UTF_8);
    }

    private static String constant(String name, String valuePattern) {
        var matcher = Pattern.compile("(?m)^\\s*" + name + ":\\s*" + valuePattern).matcher(script);
        assertThat(matcher.find()).as("the DEMO constant '%s' in capture.mjs", name).isTrue();
        return matcher.group(1);
    }

    @Test
    @DisplayName("the quest count matches")
    void countMatches() {
        assertThat(Integer.parseInt(constant("count", "(\\d+)"))).isEqualTo(DemoQuests.ALL.size());
    }

    @Test
    @DisplayName("the headline matches")
    void headlineMatches() {
        assertThat(constant("headline", "'([^']*)'")).isEqualTo(DemoQuests.HEADLINE);
    }

    @Test
    @DisplayName("the long quest matches")
    void longQuestMatches() {
        assertThat(constant("longQuest", "'([^']*)'")).isEqualTo(DemoQuests.LONG_QUEST_START);
    }
}
