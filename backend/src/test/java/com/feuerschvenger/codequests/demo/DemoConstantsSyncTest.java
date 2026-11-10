package com.feuerschvenger.codequests.demo;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.fail;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * Keeps the {@code DEMO} constants of {@code e2e/showcase/capture.mjs} equal to {@link DemoQuests}.
 * <p>
 * The capture script asserts on the quest count, the headline and the long quest, so a quest changed here without the script fails every capture run. The test reads the script as text, with a path relative to the backend module, and looks only inside its {@code const DEMO = {...}} block, so a {@code count:} or a {@code name:} elsewhere in the script is never compared. When the script is missing the test fails if the {@code CI} environment variable is set, so a moved script cannot silently disable the check in the pipeline, and is skipped with a message otherwise, for instance in a build that ships the backend alone.
 * </p>
 */
@DisplayName("Demo constants shared with the capture script")
class DemoConstantsSyncTest {

    private static final Path SCRIPT = Path.of("..", "e2e", "showcase", "capture.mjs");

    private static final Pattern DEMO_BLOCK = Pattern.compile("(?s)const\\s+DEMO\\s*=\\s*\\{(.*?)\\n\\};");

    /**
     * Returns the body of the {@code const DEMO = {...}} block, without the braces.
     *
     * @param script the text of the capture script
     * @return the text between the opening brace and the closing brace that starts a line and is followed by a semicolon, so a quest text containing a brace does not end the block early
     */
    static String demoBlock(String script) {
        var matcher = DEMO_BLOCK.matcher(script);
        assertThat(matcher.find()).as("the 'const DEMO = {' block in capture.mjs").isTrue();
        return matcher.group(1);
    }

    /**
     * Reads the DEMO block of the real script, failing in CI and skipping elsewhere when the script is not there.
     */
    private static String demoBlockOfScript() throws IOException {
        var present = Files.isRegularFile(SCRIPT);
        var message = SCRIPT.toAbsolutePath().normalize() + " is not present, so there is nothing to compare with DemoQuests.";
        var ci = System.getenv("CI");
        if (!present && ci != null && !ci.isBlank()) {
            fail("CI is set and " + message + " Update SCRIPT in DemoConstantsSyncTest if the script moved.");
        }
        assumeTrue(present, "Skipped: " + message);
        return demoBlock(Files.readString(SCRIPT, StandardCharsets.UTF_8));
    }

    private static String constant(String block, String name, String valuePattern) {
        var matcher = Pattern.compile("(?m)^\\s*" + name + ":\\s*" + valuePattern).matcher(block);
        assertThat(matcher.find()).as("the DEMO constant '%s' in capture.mjs", name).isTrue();
        return matcher.group(1);
    }

    @Test
    @DisplayName("the quest count matches")
    void countMatches() throws IOException {
        assertThat(Integer.parseInt(constant(demoBlockOfScript(), "count", "(\\d+)"))).isEqualTo(DemoQuests.ALL.size());
    }

    @Test
    @DisplayName("the headline matches")
    void headlineMatches() throws IOException {
        assertThat(constant(demoBlockOfScript(), "headline", "'([^']*)'")).isEqualTo(DemoQuests.HEADLINE);
    }

    @Test
    @DisplayName("the long quest matches")
    void longQuestMatches() throws IOException {
        assertThat(constant(demoBlockOfScript(), "longQuest", "'([^']*)'")).isEqualTo(DemoQuests.LONG_QUEST_START);
    }

    @Test
    @DisplayName("the block extraction runs to the closing brace even when a value contains one")
    void blockExtractionSurvivesBracesInValues() {
        var script = "const DEMO = {\n  count: 12,\n  headline: 'Handle {braces} in a quest',\n  longQuest: 'long',\n};\n";

        var block = demoBlock(script);

        assertThat(constant(block, "headline", "'([^']*)'")).isEqualTo("Handle {braces} in a quest");
        assertThat(constant(block, "longQuest", "'([^']*)'")).isEqualTo("long");
    }

    @Test
    @DisplayName("the block extraction ignores a decoy before the block and anything after it")
    void blockExtractionIgnoresDecoys() {
        var script = "const OTHER = {\n  count: 99,\n  headline: 'decoy',\n};\n"
                + "const DEMO = {\n  count: 12,\n  headline: 'real',\n  longQuest: 'long',\n};\n"
                + "const LATER = {\n  count: 7,\n};\n";

        var block = demoBlock(script);

        assertThat(constant(block, "count", "(\\d+)")).isEqualTo("12");
        assertThat(constant(block, "headline", "'([^']*)'")).isEqualTo("real");
        assertThat(block).doesNotContain("99").doesNotContain("decoy").doesNotContain("7,");
    }
}
