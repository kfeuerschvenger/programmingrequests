package com.feuerschvenger.codequests.repository;

import com.feuerschvenger.codequests.model.Idea;
import com.feuerschvenger.codequests.model.Vote;
import com.feuerschvenger.codequests.support.MySqlIntegrationSupport;
import org.hibernate.SessionFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.Instant;
import java.util.Arrays;
import java.util.Collection;
import java.util.Map;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest(properties = "spring.jpa.properties.hibernate.generate_statistics=true")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@DisplayName("VoteRepository")
class VoteRepositoryTest extends MySqlIntegrationSupport {

    private static final Instant BASE = Instant.parse("2026-11-04T10:00:00Z");

    @Autowired
    private VoteRepository votes;

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private SessionFactory sessionFactory;

    /** Other test classes commit rows to the shared database. This runs inside the test transaction, so the delete is rolled back with it. */
    @BeforeEach
    void emptyTables() {
        entityManager.getEntityManager().createQuery("delete from Vote").executeUpdate();
        entityManager.getEntityManager().createQuery("delete from Idea").executeUpdate();
    }

    private static byte[] voter(int seed) {
        var bytes = new byte[32];
        Arrays.fill(bytes, (byte) seed);
        return bytes;
    }

    private Idea idea(String description) {
        return entityManager.persistAndFlush(new Idea("Ada", description, BASE));
    }

    private void vote(Idea idea, byte[] voter, int value) {
        votes.saveAndFlush(new Vote(idea, voter, value));
    }

    @Test
    @DisplayName("rejects a second vote by the same voter on the same idea")
    void uniqueVoterPerIdea() {
        var idea = idea("a contested idea");
        vote(idea, voter(1), 1);

        assertThatThrownBy(() -> vote(idea, voter(1), -1)).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("allows the same voter on other ideas and other voters on the same idea")
    void uniquenessIsPerPair() {
        var first = idea("the first idea");
        var second = idea("the second idea");

        vote(first, voter(1), 1);
        vote(second, voter(1), 1);
        vote(first, voter(2), -1);

        assertThat(votes.count()).isEqualTo(3);
    }

    @Test
    @DisplayName("rejects a vote value other than 1 or -1")
    void checkConstraint() {
        var idea = idea("a checked idea");

        assertThatThrownBy(() -> vote(idea, voter(1), 0)).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("rejects a vote of 2")
    void checkConstraintUpperBound() {
        var idea = idea("another checked idea");

        assertThatThrownBy(() -> vote(idea, voter(1), 2)).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("deletes the votes of an idea that is deleted")
    void cascadeOnDelete() {
        var idea = idea("a doomed idea");
        vote(idea, voter(1), 1);
        vote(idea, voter(2), -1);
        entityManager.clear();

        entityManager.getEntityManager().createQuery("delete from Idea i where i.id = :id").setParameter("id", idea.getId()).executeUpdate();

        assertThat(votes.count()).isZero();
    }

    @Test
    @DisplayName("round-trips the 32-byte voter hash and sets both timestamps")
    void storesHashAndTimestamps() {
        var idea = idea("a stored idea");
        vote(idea, voter(7), 1);
        entityManager.clear();

        var found = votes.findByIdea_IdAndVoterHash(idea.getId(), voter(7)).orElseThrow();

        assertThat(found.getVoterHash()).isEqualTo(voter(7));
        assertThat(found.getValue()).isEqualTo(1);
        assertThat(found.getCreatedAt()).isNotNull();
        assertThat(found.getUpdatedAt()).isNotNull();
        assertThat(votes.findByIdea_IdAndVoterHash(idea.getId(), voter(8))).isEmpty();
    }

    @Test
    @DisplayName("changes a vote in place and moves updatedAt")
    void changeValue() {
        var idea = idea("a flipped idea");
        vote(idea, voter(1), 1);
        entityManager.clear();

        var found = votes.findByIdea_IdAndVoterHash(idea.getId(), voter(1)).orElseThrow();
        found.changeValue(-1);
        entityManager.flush();
        entityManager.clear();

        var reloaded = votes.findByIdea_IdAndVoterHash(idea.getId(), voter(1)).orElseThrow();
        assertThat(reloaded.getValue()).isEqualTo(-1);
        assertThat(reloaded.getUpdatedAt()).isAfterOrEqualTo(reloaded.getCreatedAt());
        assertThat(votes.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("loads the caller's votes for many ideas with one query")
    void batchQuery() {
        var a = idea("idea a for the batch");
        var b = idea("idea b for the batch");
        var c = idea("idea c for the batch");
        vote(a, voter(1), 1);
        vote(c, voter(1), -1);
        vote(b, voter(2), 1);
        vote(a, voter(2), -1);
        entityManager.clear();
        sessionFactory.getStatistics().clear();

        var result = votes.findVotesOfVoter(voter(1), ids(a, b, c)).stream()
                .collect(Collectors.toMap(IdeaVote::getIdeaId, IdeaVote::getValue));

        assertThat(result).isEqualTo(Map.of(a.getId(), 1, c.getId(), -1));
        assertThat(sessionFactory.getStatistics().getPrepareStatementCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("ignores ideas outside the requested ids")
    void batchQueryIsScoped() {
        var a = idea("idea a, scoped");
        var b = idea("idea b, scoped");
        vote(a, voter(1), 1);
        vote(b, voter(1), 1);

        assertThat(votes.findVotesOfVoter(voter(1), ids(a))).extracting(IdeaVote::getIdeaId).containsExactly(a.getId());
    }

    private static Collection<Long> ids(Idea... ideas) {
        return Arrays.stream(ideas).map(Idea::getId).toList();
    }
}
