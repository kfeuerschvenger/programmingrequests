package com.feuerschvenger.codequests.config;

import jakarta.servlet.ServletException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("MDCFilter")
class MDCFilterTest {

    private final MDCFilter filter = new MDCFilter();

    @Nested
    @DisplayName("inbound request id")
    class InboundId {

        @Test
        @DisplayName("is reused, echoed in the response and visible in the MDC during the request")
        void reusesValidId() throws ServletException, IOException {
            var seen = new AtomicReference<String>();
            var response = run("abc-123.X_y", seen);

            assertThat(response.getHeader(MDCFilter.REQUEST_ID_HEADER)).isEqualTo("abc-123.X_y");
            assertThat(seen.get()).isEqualTo("abc-123.X_y");
        }

        @Test
        @DisplayName("loses its control characters before it is used")
        void stripsControlCharacters() throws ServletException, IOException {
            var seen = new AtomicReference<String>();
            var response = run("abc\r\ninjected\t1", seen);

            assertThat(response.getHeader(MDCFilter.REQUEST_ID_HEADER)).isEqualTo("abcinjected1");
            assertThat(seen.get()).isEqualTo("abcinjected1");
        }

        @Test
        @DisplayName("loses C1 controls and Unicode separators before it is used")
        void stripsUnicodeSeparators() throws ServletException, IOException {
            var seen = new AtomicReference<String>();
            var response = run("abc\u0085  def", seen);

            assertThat(response.getHeader(MDCFilter.REQUEST_ID_HEADER)).isEqualTo("abcdef");
        }

        @Test
        @DisplayName("is replaced by a UUID when it has forbidden characters")
        void replacesInvalidId() throws ServletException, IOException {
            var response = run("bad id with spaces", new AtomicReference<>());

            assertThat(response.getHeader(MDCFilter.REQUEST_ID_HEADER)).hasSize(36).doesNotContain(" ");
        }

        @Test
        @DisplayName("is replaced by a UUID when it is longer than 64 characters")
        void replacesOversizedId() throws ServletException, IOException {
            var response = run("a".repeat(65), new AtomicReference<>());

            assertThat(response.getHeader(MDCFilter.REQUEST_ID_HEADER)).hasSize(36);
        }
    }

    @Test
    @DisplayName("generates an id when the header is missing")
    void generatesIdWhenAbsent() throws ServletException, IOException {
        var response = run(null, new AtomicReference<>());

        assertThat(response.getHeader(MDCFilter.REQUEST_ID_HEADER)).hasSize(36);
    }

    @Test
    @DisplayName("clears the MDC when the request completes")
    void clearsMdc() throws ServletException, IOException {
        run("abc", new AtomicReference<>());

        assertThat(MDC.get(MDCFilter.REQUEST_ID_MDC_KEY)).isNull();
    }

    @Test
    @DisplayName("keeps the same id on the error dispatch of the same request")
    void reusesIdOnErrorDispatch() throws ServletException, IOException {
        var request = new MockHttpServletRequest("GET", "/requests");
        var seen = new AtomicReference<String>();
        filter.doFilter(request, new MockHttpServletResponse(), (req, res) -> seen.set(MDC.get(MDCFilter.REQUEST_ID_MDC_KEY)));
        var firstId = seen.get();

        request.setAttribute(jakarta.servlet.RequestDispatcher.ERROR_REQUEST_URI, "/requests");
        var errorResponse = new MockHttpServletResponse();
        filter.doFilter(request, errorResponse, (req, res) -> seen.set(MDC.get(MDCFilter.REQUEST_ID_MDC_KEY)));

        assertThat(seen.get()).isEqualTo(firstId);
        assertThat(errorResponse.getHeader(MDCFilter.REQUEST_ID_HEADER)).isEqualTo(firstId);
    }

    private MockHttpServletResponse run(String inboundId, AtomicReference<String> seenInChain)
            throws ServletException, IOException {
        var request = new MockHttpServletRequest("GET", "/api/ideas");
        if (inboundId != null) {
            request.addHeader(MDCFilter.REQUEST_ID_HEADER, inboundId);
        }
        var response = new MockHttpServletResponse();
        var chain = new MockFilterChain();
        filter.doFilter(request, response, (req, res) -> {
            seenInChain.set(MDC.get(MDCFilter.REQUEST_ID_MDC_KEY));
            chain.doFilter(req, res);
        });
        return response;
    }
}
