package com.feuerschvenger.codequests.config;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import jakarta.servlet.RequestDispatcher;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("RequestTimingFilter")
class RequestTimingFilterTest {

    private final RequestTimingFilter filter = new RequestTimingFilter("/manage", "/api-docs", "/swagger-ui.html");
    private final Logger logger = (Logger) LoggerFactory.getLogger(RequestTimingFilter.class);
    private final ListAppender<ILoggingEvent> appender = new ListAppender<>();

    @BeforeEach
    void attach() {
        logger.setLevel(Level.INFO);
        appender.start();
        logger.addAppender(appender);
    }

    @AfterEach
    void detach() {
        logger.detachAppender(appender);
    }

    @Test
    @DisplayName("logs the response status of a completed request")
    void logsStatus() throws Exception {
        var response = new MockHttpServletResponse();
        response.setStatus(201);

        filter.doFilter(new MockHttpServletRequest("POST", "/requests"), response, (req, res) -> { });

        assertThat(appender.list).singleElement()
                .extracting(ILoggingEvent::getFormattedMessage)
                .asString().startsWith("POST UNMAPPED -> 201 in ");
    }

    @Test
    @DisplayName("logs status 500 and rethrows when the chain fails")
    void logsFailureAsServerError() {
        var response = new MockHttpServletResponse();

        assertThatThrownBy(() -> filter.doFilter(new MockHttpServletRequest("GET", "/requests"), response, (req, res) -> {
            throw new IllegalStateException("boom");
        })).isInstanceOf(IllegalStateException.class);

        assertThat(appender.list).singleElement()
                .extracting(ILoggingEvent::getFormattedMessage)
                .asString().contains("-> 500 in ");
    }

    @Test
    @DisplayName("skips the error dispatch and the configured actuator and documentation paths")
    void skipsExcluded() throws Exception {
        var error = new MockHttpServletRequest("GET", "/requests");
        error.setAttribute(RequestDispatcher.ERROR_REQUEST_URI, "/requests");

        filter.doFilter(error, new MockHttpServletResponse(), (req, res) -> { });
        filter.doFilter(new MockHttpServletRequest("GET", "/manage/health"), new MockHttpServletResponse(), (req, res) -> { });
        filter.doFilter(new MockHttpServletRequest("GET", "/api-docs"), new MockHttpServletResponse(), (req, res) -> { });
        filter.doFilter(new MockHttpServletRequest("GET", "/swagger-ui/index.html"), new MockHttpServletResponse(), (req, res) -> { });

        assertThat(appender.list).isEmpty();
    }
}
