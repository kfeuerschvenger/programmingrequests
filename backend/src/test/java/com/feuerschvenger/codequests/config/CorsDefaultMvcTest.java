package com.feuerschvenger.codequests.config;

import com.feuerschvenger.codequests.controller.IdeaController;
import com.feuerschvenger.codequests.handler.IdeaHandler;
import com.feuerschvenger.codequests.model.IdeaSort;
import com.feuerschvenger.codequests.model.dto.IdeaPageResponse;
import com.feuerschvenger.codequests.ratelimit.RateLimiter;
import com.feuerschvenger.codequests.security.ClientIdentity;
import com.feuerschvenger.codequests.security.ClientIdentityResolver;
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

@WebMvcTest(IdeaController.class)
@Import(I18nConfig.class)
@DisplayName("CORS by default")
class CorsDefaultMvcTest {

    private static final byte[] HASH = {1, 2, 3};

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private IdeaHandler handler;

    @MockitoBean
    private RateLimiter rateLimiter;

    @MockitoBean
    private ClientIdentityResolver identities;

    @Test
    @DisplayName("sends no CORS headers to a cross-origin request")
    void noCorsHeaders() throws Exception {
        when(identities.resolve(any())).thenReturn(new ClientIdentity(HASH, "client-key"));
        when(handler.list(0, 20, IdeaSort.NEWEST, HASH)).thenReturn(new IdeaPageResponse(List.of(), 0, 20, 0, 0));

        mvc.perform(get("/api/ideas").header("Origin", "https://anywhere.example"))
                .andExpect(status().isOk())
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"))
                .andExpect(header().doesNotExist("Access-Control-Allow-Credentials"));
    }

    @Test
    @DisplayName("does not answer a preflight")
    void rejectsPreflight() throws Exception {
        mvc.perform(options("/api/ideas")
                        .header("Origin", "https://anywhere.example")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }
}
