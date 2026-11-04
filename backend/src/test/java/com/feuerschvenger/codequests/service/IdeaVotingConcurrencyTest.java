package com.feuerschvenger.codequests.service;

import com.feuerschvenger.codequests.model.IdeaSort;
import com.feuerschvenger.codequests.model.dto.CreateIdeaRequest;
import com.feuerschvenger.codequests.support.MySqlIntegrationSupport;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Proves the vote upsert keeps {@code score} equal to the sum of the votes when many voters act at the same time against a real MySQL.
 */
@SpringBootTest(properties = "spring.jpa.properties.hibernate.generate_statistics=true")
@DisplayName("Concurrent voting")
class IdeaVotingConcurrencyTest extends MySqlIntegrationSupport {

    private static final int VOTERS = 60;
    private static final int THREADS = 12;

    @Autowired
    private IdeaService service;

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private EntityManagerFactory entityManagerFactory;

    @BeforeEach
    void clean() {
        jdbc.update("DELETE FROM votes");
        jdbc.update("DELETE FROM ideas");
    }

    private static byte[] voter(int number) {
        var bytes = new byte[32];
        ByteBuffer.wrap(bytes).putInt(number);
        return bytes;
    }

    private long newIdea(String description) {
        return service.create(new CreateIdeaRequest("Ada", description)).id();
    }

    private int storedScore(long ideaId) {
        return jdbc.queryForObject("SELECT score FROM ideas WHERE id = ?", Integer.class, ideaId);
    }

    private int sumOfVotes(long ideaId) {
        return jdbc.queryForObject("SELECT COALESCE(SUM(value), 0) FROM votes WHERE idea_id = ?", Integer.class, ideaId);
    }

    private int voteRows(long ideaId) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM votes WHERE idea_id = ?", Integer.class, ideaId);
    }

    private void runAll(List<Callable<Void>> tasks) throws Exception {
        var executor = Executors.newFixedThreadPool(THREADS);
        try {
            var start = new CountDownLatch(1);
            var futures = new ArrayList<java.util.concurrent.Future<Void>>();
            for (var task : tasks) {
                futures.add(executor.submit(() -> {
                    start.await();
                    return task.call();
                }));
            }
            start.countDown();
            for (var future : futures) {
                future.get(60, TimeUnit.SECONDS);
            }
        } finally {
            executor.shutdownNow();
        }
    }

    @Test
    @DisplayName("keeps the score equal to the sum of the votes when many voters vote on one idea at once")
    void manyVotersOneIdea() throws Exception {
        var ideaId = newIdea("a hotly contested idea");
        var tasks = new ArrayList<Callable<Void>>();
        for (var i = 0; i < VOTERS; i++) {
            var value = i % 3 == 0 ? -1 : 1;
            var voter = voter(i);
            tasks.add(() -> {
                service.vote(ideaId, value, voter);
                return null;
            });
        }

        runAll(tasks);

        assertThat(voteRows(ideaId)).isEqualTo(VOTERS);
        assertThat(storedScore(ideaId)).isEqualTo(sumOfVotes(ideaId));
        assertThat(storedScore(ideaId)).isEqualTo(VOTERS - 2 * (VOTERS / 3));
    }

    @Test
    @DisplayName("keeps the invariant when voters switch and withdraw across several ideas")
    void switchesAndWithdrawals() throws Exception {
        var ideas = List.of(newIdea("the first idea in the race"), newIdea("the second idea in the race"), newIdea("the third idea in the race"));
        var tasks = new ArrayList<Callable<Void>>();
        for (var i = 0; i < VOTERS; i++) {
            var voter = voter(i);
            var ideaId = ideas.get(i % ideas.size());
            tasks.add(() -> {
                service.vote(ideaId, 1, voter);
                service.vote(ideaId, -1, voter);
                if (voter[3] % 2 == 0) {
                    service.removeVote(ideaId, voter);
                }
                service.vote(ideaId, 1, voter);
                return null;
            });
        }

        runAll(tasks);

        for (var ideaId : ideas) {
            assertThat(storedScore(ideaId)).isEqualTo(sumOfVotes(ideaId));
            assertThat(storedScore(ideaId)).isEqualTo(voteRows(ideaId));
        }
    }

    @Test
    @DisplayName("keeps one row and a consistent score when the same voter races against itself")
    void sameVoterRacing() throws Exception {
        var ideaId = newIdea("an idea voted on in a hurry");
        var voter = voter(1);
        var tasks = new ArrayList<Callable<Void>>();
        for (var i = 0; i < 40; i++) {
            var value = i % 2 == 0 ? 1 : -1;
            tasks.add(() -> {
                service.vote(ideaId, value, voter);
                return null;
            });
        }

        runAll(tasks);

        assertThat(voteRows(ideaId)).isEqualTo(1);
        assertThat(storedScore(ideaId)).isEqualTo(sumOfVotes(ideaId));
    }

    @Test
    @DisplayName("lists a page with the caller's votes in a constant number of statements")
    void listUsesOneVoteQuery() {
        var voter = voter(500);
        for (var i = 0; i < 20; i++) {
            var id = newIdea("list idea number " + i);
            if (i % 2 == 0) {
                service.vote(id, 1, voter);
            }
        }

        var statistics = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        statistics.clear();

        var page = service.list(0, 20, IdeaSort.NEWEST, voter);

        // One select for the page, one for the total and one for all the caller's votes, whatever the page size.
        assertThat(statistics.getPrepareStatementCount()).isLessThanOrEqualTo(3);
        assertThat(page.items()).hasSize(20);
        assertThat(page.items().stream().filter(item -> item.myVote() == 1)).hasSize(10);
        assertThat(page.totalItems()).isEqualTo(20);
    }
}
