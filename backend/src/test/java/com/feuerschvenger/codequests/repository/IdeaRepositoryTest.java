package com.feuerschvenger.codequests.repository;

import com.feuerschvenger.codequests.model.Idea;
import com.feuerschvenger.codequests.model.IdeaSort;
import com.feuerschvenger.codequests.support.MySqlIntegrationSupport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@DisplayName("IdeaRepository")
class IdeaRepositoryTest extends MySqlIntegrationSupport {

    private static final Instant BASE = Instant.parse("2026-11-04T10:00:00Z");

    @Autowired
    private IdeaRepository repository;

    @Autowired
    private TestEntityManager entityManager;

    /** Other test classes commit rows to the shared database. This runs inside the test transaction, so the delete is rolled back with it. */
    @BeforeEach
    void emptyTables() {
        entityManager.getEntityManager().createQuery("delete from Vote").executeUpdate();
        entityManager.getEntityManager().createQuery("delete from Idea").executeUpdate();
    }

    private Idea persist(String description, Instant createdAt, int score) {
        var idea = new Idea("Ada", description, createdAt);
        idea.applyScoreDelta(score);
        return entityManager.persistAndFlush(idea);
    }

    @Nested
    @DisplayName("paging and sort")
    class PagingAndSort {

        private void seed() {
            persist("oldest idea, score two", BASE, 2);
            persist("middle idea, score nine", BASE.plusSeconds(60), 9);
            persist("newer idea, score zero", BASE.plusSeconds(120), 0);
            persist("newest idea, score five", BASE.plusSeconds(180), 5);
            persist("tied date idea, score five", BASE.plusSeconds(180), 5);
            entityManager.clear();
        }

        @Test
        @DisplayName("newest orders by date descending with the id breaking ties")
        void newest() {
            seed();

            var page = repository.findAll(PageRequest.of(0, 10, IdeaSort.NEWEST.toSort()));

            assertThat(page.getContent()).extracting(Idea::getDescription).containsExactly(
                    "tied date idea, score five", "newest idea, score five", "newer idea, score zero",
                    "middle idea, score nine", "oldest idea, score two");
        }

        @Test
        @DisplayName("oldest orders by date ascending")
        void oldest() {
            seed();

            var page = repository.findAll(PageRequest.of(0, 10, IdeaSort.OLDEST.toSort()));

            assertThat(page.getContent()).extracting(Idea::getDescription).containsExactly(
                    "oldest idea, score two", "middle idea, score nine", "newer idea, score zero",
                    "newest idea, score five", "tied date idea, score five");
        }

        @Test
        @DisplayName("top orders by score descending, then newest")
        void top() {
            seed();

            var page = repository.findAll(PageRequest.of(0, 10, IdeaSort.TOP.toSort()));

            assertThat(page.getContent()).extracting(Idea::getScore).containsExactly(9, 5, 5, 2, 0);
            assertThat(page.getContent().get(1).getDescription()).isEqualTo("tied date idea, score five");
        }

        @Test
        @DisplayName("splits the result into pages and reports the totals")
        void paging() {
            seed();

            var second = repository.findAll(PageRequest.of(1, 2, IdeaSort.NEWEST.toSort()));

            assertThat(second.getContent()).extracting(Idea::getDescription)
                    .containsExactly("newer idea, score zero", "middle idea, score nine");
            assertThat(second.getTotalElements()).isEqualTo(5);
            assertThat(second.getTotalPages()).isEqualTo(3);
            assertThat(second.getNumber()).isEqualTo(1);
        }

        @Test
        @DisplayName("returns an empty page beyond the last one")
        void beyondLastPage() {
            seed();

            var page = repository.findAll(PageRequest.of(9, 20, IdeaSort.NEWEST.toSort()));

            assertThat(page.getContent()).isEmpty();
            assertThat(page.getTotalElements()).isEqualTo(5);
        }
    }

    @Test
    @DisplayName("keeps microsecond precision of the creation date")
    void keepsMicroseconds() {
        var createdAt = Instant.parse("2026-11-04T10:00:00.123456Z");
        var saved = persist("a precise date idea", createdAt, 0);
        entityManager.clear();

        assertThat(repository.findById(saved.getId()).orElseThrow().getCreatedAt()).isEqualTo(createdAt);
    }

    @Test
    @DisplayName("stores an anonymous author as null")
    void anonymousAuthor() {
        var saved = entityManager.persistAndFlush(new Idea(null, "an anonymous idea", BASE));
        entityManager.clear();

        assertThat(repository.findById(saved.getId()).orElseThrow().getAuthor()).isNull();
    }

    @Test
    @DisplayName("accepts a description of 1000 characters and rejects 1001")
    void descriptionLength() {
        persist("x".repeat(1000), BASE, 0);

        assertThatThrownBy(() -> entityManager.persistAndFlush(new Idea("Ada", "x".repeat(1001), BASE)))
                .isInstanceOf(Exception.class);
    }

    @Test
    @DisplayName("locks and returns an idea for update")
    void findsForUpdate() {
        var saved = persist("a lockable idea", BASE, 3);
        entityManager.clear();

        assertThat(repository.findByIdForUpdate(saved.getId())).hasValueSatisfying(idea -> assertThat(idea.getScore()).isEqualTo(3));
        assertThat(repository.findByIdForUpdate(-1L)).isEmpty();
    }

    @Test
    @DisplayName("rejects an author longer than 60 characters")
    void authorLength() {
        assertThatThrownBy(() -> entityManager.persistAndFlush(new Idea("a".repeat(61), "an idea with a long author", BASE)))
                .isInstanceOfAny(DataIntegrityViolationException.class, jakarta.persistence.PersistenceException.class);
    }
}
