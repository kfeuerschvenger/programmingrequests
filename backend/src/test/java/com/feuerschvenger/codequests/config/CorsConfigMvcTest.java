package com.feuerschvenger.codequests.config;

import com.feuerschvenger.codequests.controller.IdeaController;
import com.feuerschvenger.codequests.handler.IdeaHandler;
import com.feuerschvenger.codequests.model.IdeaSort;
import com.feuerschvenger.codequests.model.dto.IdeaPageResponse;
import com.feuerschvenger.codequests.ratelimit.RateLimiter;
import com.feuerschvenger.codequests.security.VoterHasher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(value = IdeaController.class, properties = "app.cors.allowed-origins= https://quests.example , https://other.example")
@Import(I18nConfig.class)
@DisplayName("CORS with configured origins")
class CorsConfigMvcTest {

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private IdeaHandler handler;

    @MockitoBean
    private RateLimiter rateLimiter;

    @MockitoBean
    private VoterHasher voterHasher;

    @BeforeEach
    void stub() {
        when(handler.list(0, 20, IdeaSort.NEWEST, "127.0.0.1")).thenReturn(new IdeaPageResponse(List.of(), 0, 20, 0, 0));
        when(rateLimiter.tryAcquire(any(), any())).thenReturn(RateLimiter.Decision.permit());
    }

    @Test
    @DisplayName("answers a preflight from a listed origin with only that origin and no credentials")
    void allowsListedOrigin() throws Exception {
        mvc.perform(options("/api/ideas/1/vote")
                        .header("Origin", "https://quests.example")
                        .header("Access-Control-Request-Method", "PUT")
                        .header("Access-Control-Request-Headers", "content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "https://quests.example"))
                .andExpect(header().string("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE"))
                .andExpect(header().doesNotExist("Access-Control-Allow-Credentials"));
    }

    @Test
    @DisplayName("allows the second listed origin")
    void allowsSecondOrigin() throws Exception {
        mvc.perform(get("/api/ideas").header("Origin", "https://other.example"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "https://other.example"));
    }

    @Test
    @DisplayName("rejects a preflight from an origin that is not listed")
    void rejectsUnlistedOrigin() throws Exception {
        mvc.perform(options("/api/ideas")
                        .header("Origin", "https://evil.example")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }

    @Test
    @DisplayName("rejects a method outside GET, POST, PUT and DELETE")
    void rejectsOtherMethods() throws Exception {
        mvc.perform(options("/api/ideas")
                        .header("Origin", "https://quests.example")
                        .header("Access-Control-Request-Method", "PATCH"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("does not add CORS headers to a request from an unlisted origin")
    void noHeadersForUnlisted() throws Exception {
        mvc.perform(get("/api/ideas").header("Origin", "https://evil.example"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }
}
