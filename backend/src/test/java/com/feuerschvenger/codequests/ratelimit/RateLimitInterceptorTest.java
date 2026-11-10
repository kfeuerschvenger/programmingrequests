package com.feuerschvenger.codequests.ratelimit;

import com.feuerschvenger.codequests.config.VoterProperties;
import com.feuerschvenger.codequests.exception.RateLimitExceededException;
import com.feuerschvenger.codequests.security.ClientIdentityResolver;
import com.feuerschvenger.codequests.security.VoterHasher;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("RateLimitInterceptor")
class RateLimitInterceptorTest {

    private final VoterHasher hasher = new VoterHasher(new VoterProperties("interceptor-secret-interceptor-secret"));
    private final ClientIdentityResolver identities = new ClientIdentityResolver(hasher);

    @Mock
    private RateLimiter limiter;

    private RateLimitInterceptor interceptor() {
        return new RateLimitInterceptor(limiter, identities, RateLimitScope.VOTE, Set.of("PUT", "DELETE"));
    }

    private static MockHttpServletRequest request(String method) {
        var request = new MockHttpServletRequest(method, "/api/ideas/1/vote");
        request.setRemoteAddr("203.0.113.9");
        return request;
    }

    @Test
    @DisplayName("lets the request through when the limiter permits it, keyed by the hashed address")
    void permits() {
        when(limiter.tryAcquire(RateLimitScope.VOTE, hasher.hashHex("203.0.113.9"))).thenReturn(RateLimiter.Decision.permit());

        assertThat(interceptor().preHandle(request("PUT"), new MockHttpServletResponse(), new Object())).isTrue();
        verify(limiter).tryAcquire(RateLimitScope.VOTE, hasher.hashHex("203.0.113.9"));
    }

    @Test
    @DisplayName("never passes the raw address to the limiter")
    void usesHashAsKey() {
        when(limiter.tryAcquire(any(), any())).thenReturn(RateLimiter.Decision.permit());

        interceptor().preHandle(request("DELETE"), new MockHttpServletResponse(), new Object());

        verify(limiter).tryAcquire(RateLimitScope.VOTE, hasher.hashHex("203.0.113.9"));
        assertThat(hasher.hashHex("203.0.113.9")).doesNotContain("203.0.113.9");
    }

    @Test
    @DisplayName("throws with the wait time when the limiter rejects the request")
    void rejects() {
        when(limiter.tryAcquire(any(), any())).thenReturn(RateLimiter.Decision.deny(12));

        assertThatThrownBy(() -> interceptor().preHandle(request("PUT"), new MockHttpServletResponse(), new Object()))
                .isInstanceOfSatisfying(RateLimitExceededException.class, ex -> assertThat(ex.getRetryAfterSeconds()).isEqualTo(12));
    }

    @Test
    @DisplayName("ignores methods outside its set")
    void ignoresOtherMethods() {
        assertThat(interceptor().preHandle(request("GET"), new MockHttpServletResponse(), new Object())).isTrue();

        verifyNoInteractions(limiter);
    }
}
