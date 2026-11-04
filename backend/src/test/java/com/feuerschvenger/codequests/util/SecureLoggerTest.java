package com.feuerschvenger.codequests.util;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("SecureLogger")
class SecureLoggerTest {

    private final Logger logger = (Logger) LoggerFactory.getLogger(SecureLoggerTest.class);
    private final ListAppender<ILoggingEvent> appender = new ListAppender<>();

    @BeforeEach
    void attach() {
        logger.setLevel(Level.DEBUG);
        appender.start();
        logger.addAppender(appender);
    }

    @AfterEach
    void detach() {
        logger.detachAppender(appender);
    }

    @Test
    @DisplayName("removes line breaks from user input")
    void stripsLineBreaks() {
        SecureLogger.info(logger, "user={}", "bob\r\nINFO forged entry");

        assertThat(appender.list).singleElement()
                .extracting(ILoggingEvent::getFormattedMessage)
                .isEqualTo("user=bobINFO forged entry");
    }

    @Test
    @DisplayName("truncates long values to 256 characters")
    void truncates() {
        assertThat(SecureLogger.sanitize("x".repeat(1000))).hasSize(256).endsWith("...");
    }

    @Test
    @DisplayName("renders null as the text null")
    void handlesNull() {
        assertThat(SecureLogger.sanitize(null)).isEqualTo("null");
    }

    @Test
    @DisplayName("describes a throwable by its class chain and never by its message")
    void describesWithoutMessage() {
        var thrown = new IllegalStateException("secret value 42", new IllegalArgumentException("inner secret"));

        var description = SecureLogger.describe(thrown);

        assertThat(description).isEqualTo("java.lang.IllegalStateException <- java.lang.IllegalArgumentException");
        assertThat(description).doesNotContain("secret");
    }

    @Test
    @DisplayName("errorWithCause logs the class chain without the stack trace or the message")
    void errorWithCause() {
        SecureLogger.errorWithCause(logger, "save failed for {}", new RuntimeException("password=hunter2"), "idea");

        var event = appender.list.getFirst();
        assertThat(event.getLevel()).isEqualTo(Level.ERROR);
        assertThat(event.getFormattedMessage()).isEqualTo("save failed for idea | cause=java.lang.RuntimeException");
        assertThat(event.getThrowableProxy()).isNull();
    }

    @Test
    @DisplayName("skips formatting when the level is disabled")
    void respectsLevel() {
        logger.setLevel(Level.WARN);

        SecureLogger.info(logger, "ignored {}", "value");

        assertThat(appender.list).isEmpty();
    }
}
