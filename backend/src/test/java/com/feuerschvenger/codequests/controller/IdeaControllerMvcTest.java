package com.feuerschvenger.codequests.controller;

import com.feuerschvenger.codequests.config.I18nConfig;
import com.feuerschvenger.codequests.exception.IdeaNotFoundException;
import com.feuerschvenger.codequests.handler.IdeaHandler;
import com.feuerschvenger.codequests.model.IdeaSort;
import com.feuerschvenger.codequests.model.dto.CreateIdeaRequest;
import com.feuerschvenger.codequests.model.dto.IdeaPageResponse;
import com.feuerschvenger.codequests.model.dto.IdeaResponse;
import com.feuerschvenger.codequests.ratelimit.RateLimitScope;
import com.feuerschvenger.codequests.ratelimit.RateLimiter;
import com.feuerschvenger.codequests.security.ClientIdentity;
import com.feuerschvenger.codequests.security.ClientIdentityResolver;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.ConcurrencyFailureException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.sql.SQLException;
import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(IdeaController.class)
@Import(I18nConfig.class)
@DisplayName("IdeaController contract")
class IdeaControllerMvcTest {

    private static final String DESCRIPTION = "Forge a CLI that slays merge conflicts";
    private static final byte[] HASH = {9, 8, 7, 6};
    private static final ClientIdentity IDENTITY = new ClientIdentity(HASH, "client-key");
    private static final Instant CREATED = Instant.parse("2026-11-04T18:30:00.123456Z");

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private IdeaHandler handler;

    @MockitoBean
    private RateLimiter rateLimiter;

    @MockitoBean
    private ClientIdentityResolver identities;

    @BeforeEach
    void permitByDefault() {
        when(identities.resolve(any())).thenReturn(IDENTITY);
        when(rateLimiter.tryAcquire(any(), any())).thenReturn(RateLimiter.Decision.permit());
    }

    private static IdeaResponse idea(long id, int score, int myVote) {
        return new IdeaResponse(id, "Ada", DESCRIPTION, CREATED, score, myVote);
    }

    @Nested
    @DisplayName("GET /api/ideas")
    class ListIdeas {

        @Test
        @DisplayName("returns the page shape with the defaults newest, page 0, size 20")
        void defaults() throws Exception {
            when(handler.list(0, 20, IdeaSort.NEWEST, HASH))
                    .thenReturn(new IdeaPageResponse(List.of(idea(1, 3, 1), idea(2, 0, 0)), 0, 20, 2, 1));

            mvc.perform(get("/api/ideas"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.items.length()").value(2))
                    .andExpect(jsonPath("$.items[0].id").value(1))
                    .andExpect(jsonPath("$.items[0].author").value("Ada"))
                    .andExpect(jsonPath("$.items[0].description").value(DESCRIPTION))
                    .andExpect(jsonPath("$.items[0].createdAt").value("2026-11-04T18:30:00.123456Z"))
                    .andExpect(jsonPath("$.items[0].score").value(3))
                    .andExpect(jsonPath("$.items[0].myVote").value(1))
                    .andExpect(jsonPath("$.page").value(0))
                    .andExpect(jsonPath("$.size").value(20))
                    .andExpect(jsonPath("$.totalItems").value(2))
                    .andExpect(jsonPath("$.totalPages").value(1));
        }

        @Test
        @DisplayName("passes page, size and sort to the handler, ignoring the case of sort")
        void passesParameters() throws Exception {
            when(handler.list(2, 50, IdeaSort.TOP, HASH)).thenReturn(new IdeaPageResponse(List.of(), 2, 50, 0, 0));

            mvc.perform(get("/api/ideas").param("page", "2").param("size", "50").param("sort", "TOP"))
                    .andExpect(status().isOk());

            verify(handler).list(2, 50, IdeaSort.TOP, HASH);
        }

        @Test
        @DisplayName("rejects an invalid sort with a field error and does not echo the value")
        void invalidSort() throws Exception {
            mvc.perform(get("/api/ideas").param("sort", "bogus-order"))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                    .andExpect(jsonPath("$.errors[0].field").value("sort"))
                    .andExpect(jsonPath("$.errors[0].message").value("Must be one of newest, oldest or top."))
                    .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("bogus-order"))));

            verify(handler, never()).list(0, 20, IdeaSort.NEWEST, HASH);
        }

        @Test
        @DisplayName("rejects a size above 50")
        void sizeTooLarge() throws Exception {
            mvc.perform(get("/api/ideas").param("size", "51"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                    .andExpect(jsonPath("$.errors[0].field").value("size"));
        }

        @Test
        @DisplayName("rejects a size of zero")
        void sizeZero() throws Exception {
            mvc.perform(get("/api/ideas").param("size", "0"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors[0].field").value("size"));
        }

        @Test
        @DisplayName("rejects a negative page")
        void negativePage() throws Exception {
            mvc.perform(get("/api/ideas").param("page", "-1"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors[0].field").value("page"));
        }

        @Test
        @DisplayName("rejects a size that is not a number")
        void sizeNotNumeric() throws Exception {
            mvc.perform(get("/api/ideas").param("size", "many"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors[0].field").value("size"))
                    .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("many"))));
        }
    }

    @Nested
    @DisplayName("GET /api/ideas/{id}")
    class GetIdea {

        @Test
        @DisplayName("returns the idea")
        void found() throws Exception {
            when(handler.get(42, HASH)).thenReturn(idea(42, 5, -1));

            mvc.perform(get("/api/ideas/42"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(42))
                    .andExpect(jsonPath("$.score").value(5))
                    .andExpect(jsonPath("$.myVote").value(-1));
        }

        @Test
        @DisplayName("returns a 404 problem with the IDEA_NOT_FOUND code")
        void notFound() throws Exception {
            when(handler.get(404, HASH)).thenThrow(new IdeaNotFoundException());

            mvc.perform(get("/api/ideas/404"))
                    .andExpect(status().isNotFound())
                    .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                    .andExpect(jsonPath("$.status").value(404))
                    .andExpect(jsonPath("$.code").value("IDEA_NOT_FOUND"))
                    .andExpect(jsonPath("$.detail").value("That idea does not exist."));
        }

        @Test
        @DisplayName("returns a 400 problem for an id that is not a number")
        void badId() throws Exception {
            mvc.perform(get("/api/ideas/not-a-number"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors[0].field").value("id"))
                    .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("not-a-number"))));
        }
    }

    @Nested
    @DisplayName("POST /api/ideas")
    class CreateIdea {

        @Test
        @DisplayName("returns 201 with a Location header and the created idea")
        void created() throws Exception {
            when(handler.create(new CreateIdeaRequest("Ada", DESCRIPTION))).thenReturn(idea(42, 0, 0));

            mvc.perform(post("/api/ideas").contentType(MediaType.APPLICATION_JSON)
                            .content("{\"author\":\"  Ada \",\"description\":\"  " + DESCRIPTION + "  \"}"))
                    .andExpect(status().isCreated())
                    .andExpect(header().string("Location", "/api/ideas/42"))
                    .andExpect(jsonPath("$.id").value(42))
                    .andExpect(jsonPath("$.score").value(0))
                    .andExpect(jsonPath("$.myVote").value(0));
        }

        @Test
        @DisplayName("accepts a body without an author")
        void anonymous() throws Exception {
            when(handler.create(new CreateIdeaRequest(null, DESCRIPTION)))
                    .thenReturn(new IdeaResponse(43, null, DESCRIPTION, CREATED, 0, 0));

            mvc.perform(post("/api/ideas").contentType(MediaType.APPLICATION_JSON)
                            .content("{\"description\":\"" + DESCRIPTION + "\"}"))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.author").doesNotExist());
        }

        @Test
        @DisplayName("ignores a client-sent score, date and id")
        void ignoresServerFields() throws Exception {
            when(handler.create(new CreateIdeaRequest("Ada", DESCRIPTION))).thenReturn(idea(44, 0, 0));

            mvc.perform(post("/api/ideas").contentType(MediaType.APPLICATION_JSON)
                            .content("{\"author\":\"Ada\",\"description\":\"" + DESCRIPTION
                                    + "\",\"score\":9999,\"upVotes\":9999,\"createdAt\":\"1999-01-01T00:00:00Z\",\"id\":1}"))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.score").value(0))
                    .andExpect(jsonPath("$.createdAt").value("2026-11-04T18:30:00.123456Z"));

            verify(handler).create(new CreateIdeaRequest("Ada", DESCRIPTION));
        }

        @Test
        @DisplayName("names the description field when it is too short, without echoing it")
        void shortDescription() throws Exception {
            mvc.perform(post("/api/ideas").contentType(MediaType.APPLICATION_JSON)
                            .content("{\"description\":\"tiny-sec\"}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                    .andExpect(jsonPath("$.errors[0].field").value("description"))
                    .andExpect(jsonPath("$.errors[0].message").value("Must be between 10 and 1000 characters."))
                    .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("tiny-sec"))));

            verify(handler, never()).create(any());
        }

        @Test
        @DisplayName("rejects a missing or blank description")
        void blankDescription() throws Exception {
            mvc.perform(post("/api/ideas").contentType(MediaType.APPLICATION_JSON).content("{\"description\":\"   \"}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors[?(@.field=='description')]").isNotEmpty());
            mvc.perform(post("/api/ideas").contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors[?(@.field=='description')]").isNotEmpty());
        }

        @Test
        @DisplayName("rejects a description above 1000 characters")
        void longDescription() throws Exception {
            mvc.perform(post("/api/ideas").contentType(MediaType.APPLICATION_JSON)
                            .content("{\"description\":\"" + "x".repeat(1001) + "\"}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors[0].field").value("description"));
        }

        @Test
        @DisplayName("rejects an author above 60 characters")
        void longAuthor() throws Exception {
            mvc.perform(post("/api/ideas").contentType(MediaType.APPLICATION_JSON)
                            .content("{\"author\":\"" + "a".repeat(61) + "\",\"description\":\"" + DESCRIPTION + "\"}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors[0].field").value("author"))
                    .andExpect(jsonPath("$.errors[0].message").value("Must be at most 60 characters."));
        }

        @Test
        @DisplayName("returns MALFORMED_REQUEST for a body that is not JSON, without echoing it")
        void malformedJson() throws Exception {
            mvc.perform(post("/api/ideas").contentType(MediaType.APPLICATION_JSON).content("{broken-json-marker"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("MALFORMED_REQUEST"))
                    .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("broken-json-marker"))));
        }

        @Test
        @DisplayName("returns 415 for a content type other than JSON")
        void unsupportedMediaType() throws Exception {
            mvc.perform(post("/api/ideas").contentType(MediaType.TEXT_PLAIN).content("hello"))
                    .andExpect(status().isUnsupportedMediaType())
                    .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                    .andExpect(jsonPath("$.code").value("UNSUPPORTED_MEDIA_TYPE"));
        }
    }

    @Nested
    @DisplayName("PUT /api/ideas/{id}/vote")
    class CastVote {

        @Test
        @DisplayName("returns the updated idea")
        void ok() throws Exception {
            when(handler.vote(42, 1, HASH)).thenReturn(idea(42, 6, 1));

            mvc.perform(put("/api/ideas/42/vote").contentType(MediaType.APPLICATION_JSON).content("{\"value\":1}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.score").value(6))
                    .andExpect(jsonPath("$.myVote").value(1));
        }

        @Test
        @DisplayName("accepts -1")
        void downvote() throws Exception {
            when(handler.vote(42, -1, HASH)).thenReturn(idea(42, 4, -1));

            mvc.perform(put("/api/ideas/42/vote").contentType(MediaType.APPLICATION_JSON).content("{\"value\":-1}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.myVote").value(-1));
        }

        @ParameterizedTest
        @ValueSource(strings = {"{\"value\":0}", "{\"value\":2}", "{\"value\":-7}", "{}", "{\"value\":null}"})
        @DisplayName("rejects a value other than 1 or -1 with a field error")
        void invalidValue(String body) throws Exception {
            mvc.perform(put("/api/ideas/42/vote").contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                    .andExpect(jsonPath("$.errors[0].field").value("value"));

            verify(handler, never()).vote(org.mockito.ArgumentMatchers.anyLong(), org.mockito.ArgumentMatchers.anyInt(), any());
        }

        @Test
        @DisplayName("rejects a value that is not a number as a malformed request")
        void notANumber() throws Exception {
            mvc.perform(put("/api/ideas/42/vote").contentType(MediaType.APPLICATION_JSON).content("{\"value\":\"up-marker\"}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("MALFORMED_REQUEST"))
                    .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("up-marker"))));
        }

        @Test
        @DisplayName("does not read an address from the body")
        void ignoresAddressInBody() throws Exception {
            when(handler.vote(42, 1, HASH)).thenReturn(idea(42, 1, 1));

            mvc.perform(put("/api/ideas/42/vote").contentType(MediaType.APPLICATION_JSON)
                            .content("{\"value\":1,\"address\":\"203.0.113.77\"}"))
                    .andExpect(status().isOk());

            verify(handler).vote(42, 1, HASH);
        }

        @Test
        @DisplayName("returns 404 for an unknown idea")
        void notFound() throws Exception {
            when(handler.vote(9, 1, HASH)).thenThrow(new IdeaNotFoundException());

            mvc.perform(put("/api/ideas/9/vote").contentType(MediaType.APPLICATION_JSON).content("{\"value\":1}"))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.code").value("IDEA_NOT_FOUND"));
        }

        @Test
        @DisplayName("answers 405 to POST")
        void postNotAllowed() throws Exception {
            mvc.perform(post("/api/ideas/42/vote").contentType(MediaType.APPLICATION_JSON).content("{\"value\":1}"))
                    .andExpect(status().isMethodNotAllowed())
                    .andExpect(jsonPath("$.code").value("METHOD_NOT_ALLOWED"));
        }
    }

    @Nested
    @DisplayName("DELETE /api/ideas/{id}/vote")
    class WithdrawVote {

        @Test
        @DisplayName("returns the updated idea")
        void ok() throws Exception {
            when(handler.removeVote(42, HASH)).thenReturn(idea(42, 5, 0));

            mvc.perform(delete("/api/ideas/42/vote"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.score").value(5))
                    .andExpect(jsonPath("$.myVote").value(0));
        }

        @Test
        @DisplayName("returns 404 for an unknown idea")
        void notFound() throws Exception {
            when(handler.removeVote(9, HASH)).thenThrow(new IdeaNotFoundException());

            mvc.perform(delete("/api/ideas/9/vote"))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.code").value("IDEA_NOT_FOUND"));
        }
    }

    @Nested
    @DisplayName("rate limiting")
    class RateLimiting {

        @Test
        @DisplayName("answers 429 with Retry-After when creating ideas too often, without calling the handler")
        void createLimited() throws Exception {
            when(rateLimiter.tryAcquire(RateLimitScope.CREATE_IDEA, "client-key")).thenReturn(RateLimiter.Decision.deny(42));

            mvc.perform(post("/api/ideas").contentType(MediaType.APPLICATION_JSON)
                            .content("{\"description\":\"" + DESCRIPTION + "\"}"))
                    .andExpect(status().isTooManyRequests())
                    .andExpect(header().string("Retry-After", "42"))
                    .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                    .andExpect(jsonPath("$.code").value("RATE_LIMITED"))
                    .andExpect(jsonPath("$.retryAfterSeconds").value(42));

            verify(handler, never()).create(any());
        }

        @Test
        @DisplayName("answers 429 when voting too often")
        void voteLimited() throws Exception {
            when(rateLimiter.tryAcquire(RateLimitScope.VOTE, "client-key")).thenReturn(RateLimiter.Decision.deny(7));

            mvc.perform(put("/api/ideas/42/vote").contentType(MediaType.APPLICATION_JSON).content("{\"value\":1}"))
                    .andExpect(status().isTooManyRequests())
                    .andExpect(header().string("Retry-After", "7"));
        }

        @Test
        @DisplayName("answers 429 when withdrawing votes too often")
        void withdrawLimited() throws Exception {
            when(rateLimiter.tryAcquire(RateLimitScope.VOTE, "client-key")).thenReturn(RateLimiter.Decision.deny(7));

            mvc.perform(delete("/api/ideas/42/vote"))
                    .andExpect(status().isTooManyRequests())
                    .andExpect(header().string("Retry-After", "7"));
        }

        @Test
        @DisplayName("limits creation and votes under separate scopes")
        void scopes() throws Exception {
            when(handler.create(any())).thenReturn(idea(1, 0, 0));
            when(handler.vote(42, 1, HASH)).thenReturn(idea(42, 1, 1));

            mvc.perform(post("/api/ideas").contentType(MediaType.APPLICATION_JSON)
                    .content("{\"description\":\"" + DESCRIPTION + "\"}")).andExpect(status().isCreated());
            mvc.perform(put("/api/ideas/42/vote").contentType(MediaType.APPLICATION_JSON).content("{\"value\":1}"))
                    .andExpect(status().isOk());

            verify(rateLimiter).tryAcquire(RateLimitScope.CREATE_IDEA, "client-key");
            verify(rateLimiter).tryAcquire(RateLimitScope.VOTE, "client-key");
        }

        @Test
        @DisplayName("does not limit reads")
        void readsAreFree() throws Exception {
            when(handler.list(0, 20, IdeaSort.NEWEST, HASH)).thenReturn(new IdeaPageResponse(List.of(), 0, 20, 0, 0));
            when(handler.get(1, HASH)).thenReturn(idea(1, 0, 0));

            mvc.perform(get("/api/ideas")).andExpect(status().isOk());
            mvc.perform(get("/api/ideas/1")).andExpect(status().isOk());

            verifyNoInteractions(rateLimiter);
        }
    }

    @Nested
    @DisplayName("error responses")
    class Errors {

        @Test
        @DisplayName("answers 405 with a problem for a method the route does not support")
        void methodNotAllowed() throws Exception {
            mvc.perform(patch("/api/ideas"))
                    .andExpect(status().isMethodNotAllowed())
                    .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                    .andExpect(jsonPath("$.code").value("METHOD_NOT_ALLOWED"))
                    .andExpect(jsonPath("$.detail").value("That HTTP method is not supported here."));
            mvc.perform(delete("/api/ideas"))
                    .andExpect(status().isMethodNotAllowed());
        }

        @Test
        @DisplayName("answers 404 with a problem for an unknown route, without echoing the path")
        void unknownRoute() throws Exception {
            mvc.perform(get("/api/unknown-route-marker"))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.code").value("RESOURCE_NOT_FOUND"))
                    .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("unknown-route-marker"))));
        }

        @Test
        @DisplayName("answers 409 with the CONFLICT code for a lock or concurrency failure")
        void conflict() throws Exception {
            when(handler.create(any())).thenThrow(new ConcurrencyFailureException("Deadlock found for key 'secret-key'"));

            mvc.perform(post("/api/ideas").contentType(MediaType.APPLICATION_JSON)
                            .content("{\"description\":\"" + DESCRIPTION + "\"}"))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.code").value("CONFLICT"))
                    .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("secret-key"))));
        }

        @Test
        @DisplayName("answers 409 for a duplicate vote and 500 for any other constraint violation")
        void integrityViolations() throws Exception {
            when(handler.vote(eq(5L), eq(1), any())).thenThrow(new DataIntegrityViolationException("x",
                    new SQLException("Duplicate entry 'secret-key' for key 'votes.uq_votes_idea_voter'", "23000", 1062)));
            when(handler.create(any())).thenThrow(new DataIntegrityViolationException("x",
                    new SQLException("Column 'description' cannot be null secret-key", "23000", 1048)));

            mvc.perform(put("/api/ideas/5/vote").contentType(MediaType.APPLICATION_JSON).content("{\"value\":1}"))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.code").value("CONFLICT"));
            mvc.perform(post("/api/ideas").contentType(MediaType.APPLICATION_JSON)
                            .content("{\"description\":\"" + DESCRIPTION + "\"}"))
                    .andExpect(status().isInternalServerError())
                    .andExpect(jsonPath("$.code").value("INTERNAL_ERROR"))
                    .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("secret-key"))));
        }

        @Test
        @DisplayName("answers 500 with a generic problem and never the exception text")
        void unexpected() throws Exception {
            when(handler.get(eq(1L), any())).thenThrow(new IllegalStateException("password=hunter2"));

            mvc.perform(get("/api/ideas/1"))
                    .andExpect(status().isInternalServerError())
                    .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                    .andExpect(jsonPath("$.code").value("INTERNAL_ERROR"))
                    .andExpect(jsonPath("$.detail").value("Something went wrong. Try again later."))
                    .andExpect(jsonPath("$.title").value("Internal Server Error"))
                    .andExpect(jsonPath("$.instance").value(org.hamcrest.Matchers.startsWith("urn:request-id:")))
                    .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("hunter2"))));
        }
    }
}
