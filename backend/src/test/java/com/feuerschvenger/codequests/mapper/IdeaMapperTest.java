package com.feuerschvenger.codequests.mapper;

import com.feuerschvenger.codequests.model.Idea;
import com.feuerschvenger.codequests.model.dto.CreateIdeaRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("IdeaMapper")
class IdeaMapperTest {

    private static final Instant NOW = Instant.parse("2026-11-04T18:30:00Z");

    private final IdeaMapper mapper = new IdeaMapper();

    private static Idea idea(long id, String author, int score) {
        var idea = new Idea(author, "Forge a CLI that slays merge conflicts", NOW);
        ReflectionTestUtils.setField(idea, "id", id);
        ReflectionTestUtils.setField(idea, "score", score);
        return idea;
    }

    @Test
    @DisplayName("builds an entity with a zero score and the given date")
    void toEntity() {
        var entity = mapper.toEntity(new CreateIdeaRequest("Ada", "Forge a CLI that slays merge conflicts"), NOW);

        assertThat(entity.getId()).isNull();
        assertThat(entity.getAuthor()).isEqualTo("Ada");
        assertThat(entity.getDescription()).isEqualTo("Forge a CLI that slays merge conflicts");
        assertThat(entity.getCreatedAt()).isEqualTo(NOW);
        assertThat(entity.getScore()).isZero();
    }

    @Test
    @DisplayName("keeps an anonymous author as null")
    void anonymousAuthor() {
        var entity = mapper.toEntity(new CreateIdeaRequest(" ", "Forge a CLI that slays merge conflicts"), NOW);

        assertThat(entity.getAuthor()).isNull();
    }

    @Test
    @DisplayName("builds a response field by field with the caller's vote")
    void toResponse() {
        var response = mapper.toResponse(idea(7, "Ada", 12), -1);

        assertThat(response.id()).isEqualTo(7);
        assertThat(response.author()).isEqualTo("Ada");
        assertThat(response.description()).isEqualTo("Forge a CLI that slays merge conflicts");
        assertThat(response.createdAt()).isEqualTo(NOW);
        assertThat(response.score()).isEqualTo(12);
        assertThat(response.myVote()).isEqualTo(-1);
    }

    @Test
    @DisplayName("fills myVote from the map and defaults to zero")
    void toPageResponse() {
        var page = new PageImpl<>(List.of(idea(1, "Ada", 3), idea(2, null, 0)), PageRequest.of(1, 2), 5);

        var response = mapper.toPageResponse(page, Map.of(1L, 1));

        assertThat(response.items()).extracting("id", "myVote").containsExactly(
                org.assertj.core.groups.Tuple.tuple(1L, 1),
                org.assertj.core.groups.Tuple.tuple(2L, 0));
        assertThat(response.page()).isEqualTo(1);
        assertThat(response.size()).isEqualTo(2);
        assertThat(response.totalItems()).isEqualTo(5);
        assertThat(response.totalPages()).isEqualTo(3);
    }
}
