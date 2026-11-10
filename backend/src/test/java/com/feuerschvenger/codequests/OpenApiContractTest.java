package com.feuerschvenger.codequests;

import com.feuerschvenger.codequests.exception.ErrorCode;
import com.feuerschvenger.codequests.support.MySqlIntegrationSupport;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Reads the generated OpenAPI document and checks the properties the exported {@code docs/openapi.yaml} promises: numeric enums, the case-insensitive lower-case sort values, the real problem body, the documented error responses and JSON success responses.
 */
@SpringBootTest(properties = "springdoc.api-docs.enabled=true")
@AutoConfigureMockMvc
@DisplayName("OpenAPI document")
class OpenApiContractTest extends MySqlIntegrationSupport {

    private static final String LIST = "$.paths['/api/ideas'].get";
    private static final String VOTE = "$.paths['/api/ideas/{id}/vote'].put";

    @Autowired
    private MockMvc mvc;

    @Test
    @DisplayName("documents sort as lower-case values, case-insensitive, defaulting to newest")
    void sortParameter() throws Exception {
        var sort = LIST + ".parameters[?(@.name=='sort')]";
        mvc.perform(get("/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath(sort + ".schema.enum[0]").value("newest"))
                .andExpect(jsonPath(sort + ".schema.enum[1]").value("oldest"))
                .andExpect(jsonPath(sort + ".schema.enum[2]").value("top"))
                .andExpect(jsonPath(sort + ".schema.default").value("newest"))
                .andExpect(jsonPath(sort + ".description").value(hasItem(containsString("case-insensitive"))));
    }

    @Test
    @DisplayName("exports the vote enums as integers")
    void voteEnums() throws Exception {
        mvc.perform(get("/api-docs"))
                .andExpect(jsonPath("$.components.schemas.VoteRequest.properties.value.enum[0]").value(-1))
                .andExpect(jsonPath("$.components.schemas.VoteRequest.properties.value.enum[1]").value(1))
                .andExpect(jsonPath("$.components.schemas.IdeaResponse.properties.myVote.enum[0]").value(-1))
                .andExpect(jsonPath("$.components.schemas.IdeaResponse.properties.myVote.enum[1]").value(0))
                .andExpect(jsonPath("$.components.schemas.IdeaResponse.properties.myVote.enum[2]").value(1));
    }

    @Test
    @DisplayName("models the problem body with code, errors and retryAfterSeconds")
    void problemSchema() throws Exception {
        var problem = "$.components.schemas.ProblemDetail.properties";
        var codes = Arrays.stream(ErrorCode.values()).map(Enum::name).toArray(String[]::new);
        mvc.perform(get("/api-docs"))
                .andExpect(jsonPath(problem + ".code.enum").value(contains(codes)))
                .andExpect(jsonPath(problem + ".errors.items.properties.field.type").value("string"))
                .andExpect(jsonPath(problem + ".errors.items.properties.message.type").value("string"))
                .andExpect(jsonPath(problem + ".retryAfterSeconds.type").value("integer"))
                .andExpect(jsonPath(problem + ".properties").doesNotExist());
    }

    @Test
    @DisplayName("lists the error responses as problem+json and the Retry-After header on 429")
    void errorResponses() throws Exception {
        mvc.perform(get("/api-docs"))
                .andExpect(jsonPath(VOTE + ".responses['400'].content['application/problem+json']").exists())
                .andExpect(jsonPath(VOTE + ".responses['404'].content['application/problem+json']").exists())
                .andExpect(jsonPath(VOTE + ".responses['409'].content['application/problem+json']").exists())
                .andExpect(jsonPath(VOTE + ".responses['429'].content['application/problem+json']").exists())
                .andExpect(jsonPath(VOTE + ".responses['429'].headers['Retry-After']").exists())
                .andExpect(jsonPath(VOTE + ".responses['415'].content['application/problem+json']").exists())
                .andExpect(jsonPath(VOTE + ".responses['500'].content['application/problem+json']").exists())
                .andExpect(jsonPath("$.paths['/api/ideas'].post.responses['415'].content['application/problem+json']").exists())
                .andExpect(jsonPath(LIST + ".responses['500'].content['application/problem+json']").exists())
                .andExpect(jsonPath("$.paths['/api/ideas'].post.responses['409']").exists())
                .andExpect(jsonPath("$.paths['/api/ideas'].post.responses['429'].headers['Retry-After']").exists());
    }

    @Test
    @DisplayName("answers success responses as application/json, not */*")
    void successMediaType() throws Exception {
        mvc.perform(get("/api-docs"))
                .andExpect(jsonPath(LIST + ".responses['200'].content['application/json']").exists())
                .andExpect(jsonPath(LIST + ".responses['200'].content['*/*']").doesNotExist())
                .andExpect(jsonPath("$.paths['/api/ideas'].post.responses['201'].content['application/json']").exists())
                .andExpect(jsonPath(VOTE + ".responses['200'].content['application/json']").exists());
    }
}
