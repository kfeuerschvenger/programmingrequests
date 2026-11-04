package com.feuerschvenger.codequests.service;

import com.feuerschvenger.codequests.exception.IdeaNotFoundException;
import com.feuerschvenger.codequests.mapper.IdeaMapper;
import com.feuerschvenger.codequests.model.Idea;
import com.feuerschvenger.codequests.model.IdeaSort;
import com.feuerschvenger.codequests.model.Vote;
import com.feuerschvenger.codequests.model.dto.CreateIdeaRequest;
import com.feuerschvenger.codequests.repository.IdeaRepository;
import com.feuerschvenger.codequests.repository.IdeaVote;
import com.feuerschvenger.codequests.repository.VoteRepository;
import com.feuerschvenger.codequests.service.impl.IdeaServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("IdeaServiceImpl")
class IdeaServiceImplTest {

    private static final Instant NOW = Instant.parse("2026-11-04T18:30:00.123456789Z");
    private static final byte[] VOTER = new byte[32];

    @Mock
    private IdeaRepository ideaRepository;

    @Mock
    private VoteRepository voteRepository;

    private IdeaServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new IdeaServiceImpl(ideaRepository, voteRepository, new IdeaMapper(), Clock.fixed(NOW, ZoneOffset.UTC));
    }

    private static Idea idea(long id, int score) {
        var idea = new Idea("Ada", "Forge a CLI that slays merge conflicts", NOW);
        ReflectionTestUtils.setField(idea, "id", id);
        ReflectionTestUtils.setField(idea, "score", score);
        return idea;
    }

    private static IdeaVote ideaVote(long ideaId, int value) {
        return new IdeaVote() {
            @Override
            public Long getIdeaId() {
                return ideaId;
            }

            @Override
            public int getValue() {
                return value;
            }
        };
    }

    @Nested
    @DisplayName("list")
    class ListIdeas {

        @Test
        @DisplayName("loads the caller's votes for the whole page with one query")
        void oneVoteQueryPerPage() {
            Page<Idea> page = new PageImpl<>(List.of(idea(1, 3), idea(2, 0), idea(3, -1)));
            when(ideaRepository.findAll(any(Pageable.class))).thenReturn(page);
            when(voteRepository.findVotesOfVoter(any(), anyCollection())).thenReturn(List.of(ideaVote(1, 1), ideaVote(3, -1)));

            var response = service.list(0, 20, IdeaSort.TOP, VOTER);

            assertThat(response.items()).extracting("myVote").containsExactly(1, 0, -1);
            verify(voteRepository).findVotesOfVoter(VOTER, List.of(1L, 2L, 3L));
        }

        @Test
        @DisplayName("requests the page with the whitelisted ordering")
        void usesSort() {
            when(ideaRepository.findAll(any(Pageable.class))).thenReturn(Page.empty());

            service.list(2, 10, IdeaSort.OLDEST, VOTER);

            var captor = ArgumentCaptor.forClass(Pageable.class);
            verify(ideaRepository).findAll(captor.capture());
            assertThat(captor.getValue().getPageNumber()).isEqualTo(2);
            assertThat(captor.getValue().getPageSize()).isEqualTo(10);
            assertThat(captor.getValue().getSort()).isEqualTo(IdeaSort.OLDEST.toSort());
        }

        @Test
        @DisplayName("skips the vote query when the page is empty")
        void emptyPage() {
            when(ideaRepository.findAll(any(Pageable.class))).thenReturn(Page.empty());

            assertThat(service.list(0, 20, IdeaSort.NEWEST, VOTER).items()).isEmpty();
            verify(voteRepository, never()).findVotesOfVoter(any(), anyCollection());
        }
    }

    @Nested
    @DisplayName("get")
    class GetIdea {

        @Test
        @DisplayName("returns the idea with the caller's vote")
        void found() {
            when(ideaRepository.findById(5L)).thenReturn(Optional.of(idea(5, 2)));
            var vote = new Vote(idea(5, 2), VOTER, -1);
            when(voteRepository.findByIdea_IdAndVoterHash(5L, VOTER)).thenReturn(Optional.of(vote));

            var response = service.get(5, VOTER);

            assertThat(response.id()).isEqualTo(5);
            assertThat(response.myVote()).isEqualTo(-1);
        }

        @Test
        @DisplayName("reports zero when the caller has not voted")
        void noVote() {
            when(ideaRepository.findById(5L)).thenReturn(Optional.of(idea(5, 2)));
            when(voteRepository.findByIdea_IdAndVoterHash(5L, VOTER)).thenReturn(Optional.empty());

            assertThat(service.get(5, VOTER).myVote()).isZero();
        }

        @Test
        @DisplayName("throws not found for an unknown id")
        void missing() {
            when(ideaRepository.findById(9L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.get(9, VOTER)).isInstanceOf(IdeaNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("create")
    class CreateIdea {

        @Test
        @DisplayName("stores the idea with a zero score and a server date cut to microseconds")
        void createsWithServerValues() {
            when(ideaRepository.save(any(Idea.class))).thenAnswer(call -> {
                var saved = call.getArgument(0, Idea.class);
                ReflectionTestUtils.setField(saved, "id", 11L);
                return saved;
            });

            var response = service.create(new CreateIdeaRequest("Ada", "Forge a CLI that slays merge conflicts"));

            var captor = ArgumentCaptor.forClass(Idea.class);
            verify(ideaRepository).save(captor.capture());
            assertThat(captor.getValue().getScore()).isZero();
            assertThat(captor.getValue().getCreatedAt()).isEqualTo(Instant.parse("2026-11-04T18:30:00.123456Z"));
            assertThat(response.id()).isEqualTo(11);
            assertThat(response.score()).isZero();
            assertThat(response.myVote()).isZero();
        }
    }
}
