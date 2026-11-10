package com.feuerschvenger.codequests.ratelimit;

import com.feuerschvenger.codequests.config.RateLimitProperties;
import com.feuerschvenger.codequests.config.RateLimitProperties.Limit;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("RateLimiter")
class RateLimiterTest {

    private static RateLimiter limiter(int createCapacity, Duration createWindow, int voteCapacity) {
        return new RateLimiter(new RateLimitProperties(
                new Limit(createCapacity, createWindow), new Limit(voteCapacity, Duration.ofMinutes(1)), 100));
    }

    @Test
    @DisplayName("permits calls up to the capacity and rejects the next one")
    void rejectsAfterCapacity() {
        var limiter = limiter(3, Duration.ofMinutes(10), 30);

        for (var i = 0; i < 3; i++) {
            assertThat(limiter.tryAcquire(RateLimitScope.CREATE_IDEA, "a").allowed()).isTrue();
        }

        assertThat(limiter.tryAcquire(RateLimitScope.CREATE_IDEA, "a").allowed()).isFalse();
    }

    @Test
    @DisplayName("tells the caller how long to wait, in whole seconds of at least one")
    void reportsRetryAfter() {
        var limiter = limiter(1, Duration.ofMinutes(10), 30);
        limiter.tryAcquire(RateLimitScope.CREATE_IDEA, "a");

        var decision = limiter.tryAcquire(RateLimitScope.CREATE_IDEA, "a");

        assertThat(decision.allowed()).isFalse();
        assertThat(decision.retryAfterSeconds()).isBetween(1L, 600L);
    }

    @Test
    @DisplayName("rounds a sub-second wait up to one second")
    void roundsUp() {
        var limiter = limiter(1, Duration.ofMillis(200), 30);
        limiter.tryAcquire(RateLimitScope.CREATE_IDEA, "a");

        assertThat(limiter.tryAcquire(RateLimitScope.CREATE_IDEA, "a").retryAfterSeconds()).isEqualTo(1);
    }

    @Test
    @DisplayName("keeps a separate bucket for each client")
    void isolatesClients() {
        var limiter = limiter(1, Duration.ofMinutes(10), 30);
        limiter.tryAcquire(RateLimitScope.CREATE_IDEA, "a");

        assertThat(limiter.tryAcquire(RateLimitScope.CREATE_IDEA, "a").allowed()).isFalse();
        assertThat(limiter.tryAcquire(RateLimitScope.CREATE_IDEA, "b").allowed()).isTrue();
    }

    @Test
    @DisplayName("keeps a separate bucket for each scope")
    void isolatesScopes() {
        var limiter = limiter(1, Duration.ofMinutes(10), 30);
        limiter.tryAcquire(RateLimitScope.CREATE_IDEA, "a");

        assertThat(limiter.tryAcquire(RateLimitScope.CREATE_IDEA, "a").allowed()).isFalse();
        assertThat(limiter.tryAcquire(RateLimitScope.VOTE, "a").allowed()).isTrue();
    }

    @Test
    @DisplayName("refills after the window")
    void refills() throws InterruptedException {
        var limiter = limiter(1, Duration.ofMillis(150), 30);
        limiter.tryAcquire(RateLimitScope.CREATE_IDEA, "a");
        assertThat(limiter.tryAcquire(RateLimitScope.CREATE_IDEA, "a").allowed()).isFalse();

        Thread.sleep(300);

        assertThat(limiter.tryAcquire(RateLimitScope.CREATE_IDEA, "a").allowed()).isTrue();
    }

    @Test
    @DisplayName("applies the vote capacity independently")
    void voteCapacity() {
        var limiter = limiter(5, Duration.ofMinutes(10), 2);

        assertThat(limiter.tryAcquire(RateLimitScope.VOTE, "a").allowed()).isTrue();
        assertThat(limiter.tryAcquire(RateLimitScope.VOTE, "a").allowed()).isTrue();
        assertThat(limiter.tryAcquire(RateLimitScope.VOTE, "a").allowed()).isFalse();
    }

    @Test
    @DisplayName("rejects non-positive configuration")
    void validatesProperties() {
        assertThatThrownBy(() -> new Limit(0, Duration.ofMinutes(1))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new Limit(1, Duration.ZERO)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new Limit(1, null)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new RateLimitProperties(null, new Limit(1, Duration.ofMinutes(1)), 10))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new RateLimitProperties(new Limit(1, Duration.ofMinutes(1)), new Limit(1, Duration.ofMinutes(1)), 0))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
