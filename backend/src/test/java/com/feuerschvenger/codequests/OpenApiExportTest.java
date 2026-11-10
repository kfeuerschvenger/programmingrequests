package com.feuerschvenger.codequests;

import com.feuerschvenger.codequests.support.MySqlIntegrationSupport;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.yaml.snakeyaml.Yaml;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.fail;
import static org.junit.jupiter.api.Assumptions.assumeTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Keeps the exported {@code docs/openapi.yaml} equal to the document the running API serves at {@code /api-docs.yaml}.
 * <p>
 * Both texts are parsed and the resulting structures are compared, so key order and formatting never fail the test. The test reads the file with a path relative to the backend module. When the file is missing it fails if the {@code CI} environment variable is set and is skipped with a message otherwise, for instance in a build that ships the backend alone.
 * </p>
 * <p>
 * To regenerate the export, run the test with {@code -Dopenapi.write=true}: it then rewrites the file from the live document instead of asserting.
 * </p>
 */
@SpringBootTest(properties = "springdoc.api-docs.enabled=true")
@AutoConfigureMockMvc
@DisplayName("Exported OpenAPI file")
class OpenApiExportTest extends MySqlIntegrationSupport {

    private static final Path EXPORT = Path.of("..", "docs", "openapi.yaml");

    @Autowired
    private MockMvc mvc;

    @Test
    @DisplayName("matches the live document, or rewrites itself under -Dopenapi.write=true")
    void exportMatchesLiveDocument() throws Exception {
        var live = mvc.perform(get("/api-docs.yaml"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);

        if (Boolean.getBoolean("openapi.write")) {
            Files.writeString(EXPORT, live, StandardCharsets.UTF_8);
            return;
        }

        var message = EXPORT.toAbsolutePath().normalize() + " is not present, so there is nothing to compare with the live document.";
        var ci = System.getenv("CI");
        if (!Files.isRegularFile(EXPORT) && ci != null && !ci.isBlank()) {
            fail("CI is set and " + message);
        }
        assumeTrue(Files.isRegularFile(EXPORT), "Skipped: " + message);

        assertThat(parse(Files.readString(EXPORT, StandardCharsets.UTF_8)))
                .as("docs/openapi.yaml differs from /api-docs.yaml. Regenerate it with: ./gradlew test --tests \"*OpenApiExportTest\" -Dopenapi.write=true")
                .isEqualTo(parse(live));
    }

    private static Object parse(String yaml) {
        return new Yaml().load(yaml);
    }
}
