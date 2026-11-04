package com.feuerschvenger.codequests.handler;

import com.feuerschvenger.codequests.config.VoterProperties;
import com.feuerschvenger.codequests.handler.impl.IdeaHandlerImpl;
import com.feuerschvenger.codequests.model.IdeaSort;
import com.feuerschvenger.codequests.model.dto.CreateIdeaRequest;
import com.feuerschvenger.codequests.model.dto.IdeaPageResponse;
import com.feuerschvenger.codequests.model.dto.IdeaResponse;
import com.feuerschvenger.codequests.security.VoterHasher;
import com.feuerschvenger.codequests.service.IdeaService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("IdeaHandlerImpl")
class IdeaHandlerImplTest {

    private static final String ADDRESS = "203.0.113.9";

    @Mock
    private IdeaService service;

    private final VoterHasher hasher = new VoterHasher(new VoterProperties("handler-test-secret-handler-test-secret"));

    private IdeaHandler handler() {
        return new IdeaHandlerImpl(service, hasher);
    }

    @Test
    @DisplayName("passes the hashed address, never the address, when listing")
    void listUsesHash() {
        var expected = new IdeaPageResponse(List.of(), 0, 20, 0, 0);
        when(service.list(0, 20, IdeaSort.NEWEST, hasher.hash(ADDRESS))).thenReturn(expected);

        assertThat(handler().list(0, 20, IdeaSort.NEWEST, ADDRESS)).isSameAs(expected);
        verify(service).list(0, 20, IdeaSort.NEWEST, hasher.hash(ADDRESS));
    }

    @Test
    @DisplayName("passes the hashed address when reading one idea")
    void getUsesHash() {
        var expected = new IdeaResponse(5, null, "Forge a CLI that slays merge conflicts", Instant.EPOCH, 0, 0);
        when(service.get(5, hasher.hash(ADDRESS))).thenReturn(expected);

        assertThat(handler().get(5, ADDRESS)).isSameAs(expected);
    }

    @Test
    @DisplayName("passes the hashed address when voting")
    void voteUsesHash() {
        var expected = new IdeaResponse(5, null, "Forge a CLI that slays merge conflicts", Instant.EPOCH, 1, 1);
        when(service.vote(5, 1, hasher.hash(ADDRESS))).thenReturn(expected);

        assertThat(handler().vote(5, 1, ADDRESS)).isSameAs(expected);
    }

    @Test
    @DisplayName("passes the hashed address when withdrawing a vote")
    void removeVoteUsesHash() {
        var expected = new IdeaResponse(5, null, "Forge a CLI that slays merge conflicts", Instant.EPOCH, 0, 0);
        when(service.removeVote(5, hasher.hash(ADDRESS))).thenReturn(expected);

        assertThat(handler().removeVote(5, ADDRESS)).isSameAs(expected);
    }

    @Test
    @DisplayName("delegates creation unchanged")
    void createDelegates() {
        var request = new CreateIdeaRequest("Ada", "Forge a CLI that slays merge conflicts");
        var expected = new IdeaResponse(5, "Ada", request.description(), Instant.EPOCH, 0, 0);
        when(service.create(request)).thenReturn(expected);

        assertThat(handler().create(request)).isSameAs(expected);
    }
}
