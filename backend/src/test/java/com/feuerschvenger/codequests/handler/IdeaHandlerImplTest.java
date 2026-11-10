package com.feuerschvenger.codequests.handler;

import com.feuerschvenger.codequests.handler.impl.IdeaHandlerImpl;
import com.feuerschvenger.codequests.model.IdeaSort;
import com.feuerschvenger.codequests.model.dto.CreateIdeaRequest;
import com.feuerschvenger.codequests.model.dto.IdeaPageResponse;
import com.feuerschvenger.codequests.model.dto.IdeaResponse;
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

    private static final byte[] HASH = {1, 2, 3, 4};

    @Mock
    private IdeaService service;

    private IdeaHandler handler() {
        return new IdeaHandlerImpl(service);
    }

    @Test
    @DisplayName("passes the voter hash through when listing")
    void listUsesHash() {
        var expected = new IdeaPageResponse(List.of(), 0, 20, 0, 0);
        when(service.list(0, 20, IdeaSort.NEWEST, HASH)).thenReturn(expected);

        assertThat(handler().list(0, 20, IdeaSort.NEWEST, HASH)).isSameAs(expected);
        verify(service).list(0, 20, IdeaSort.NEWEST, HASH);
    }

    @Test
    @DisplayName("passes the voter hash through when reading one idea")
    void getUsesHash() {
        var expected = new IdeaResponse(5, null, "Forge a CLI that slays merge conflicts", Instant.EPOCH, 0, 0);
        when(service.get(5, HASH)).thenReturn(expected);

        assertThat(handler().get(5, HASH)).isSameAs(expected);
    }

    @Test
    @DisplayName("passes the voter hash through when voting")
    void voteUsesHash() {
        var expected = new IdeaResponse(5, null, "Forge a CLI that slays merge conflicts", Instant.EPOCH, 1, 1);
        when(service.vote(5, 1, HASH)).thenReturn(expected);

        assertThat(handler().vote(5, 1, HASH)).isSameAs(expected);
    }

    @Test
    @DisplayName("passes the voter hash through when withdrawing a vote")
    void removeVoteUsesHash() {
        var expected = new IdeaResponse(5, null, "Forge a CLI that slays merge conflicts", Instant.EPOCH, 0, 0);
        when(service.removeVote(5, HASH)).thenReturn(expected);

        assertThat(handler().removeVote(5, HASH)).isSameAs(expected);
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
