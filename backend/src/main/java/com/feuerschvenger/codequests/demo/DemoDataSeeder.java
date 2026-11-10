package com.feuerschvenger.codequests.demo;

import com.feuerschvenger.codequests.model.Idea;
import com.feuerschvenger.codequests.model.Vote;
import com.feuerschvenger.codequests.repository.IdeaRepository;
import com.feuerschvenger.codequests.repository.VoteRepository;
import com.feuerschvenger.codequests.security.VoterHasher;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

/**
 * Resets the database to a fixed demo board at startup. Active only under the Spring profile {@code demo}.
 * <p>
 * Every run deletes all votes and ideas, then inserts {@link DemoQuests#ALL} with votes from fictitious voters, so screenshots and recordings start from the same data each time. The seeder refuses to run unless {@code demo.seed.confirm} is {@code wipe} and the datasource host is local, see {@link DemoSeedGuard}. The voter ids are the HMAC of documentation-range addresses under the configured secret, so they are well formed and deterministic and match no real visitor.
 * </p>
 */
@Slf4j
@Component
@Profile("demo")
public class DemoDataSeeder implements ApplicationRunner {

    /** Number of fictitious voters. It bounds the votes one quest can hold. */
    static final int VOTER_POOL = 40;

    /** Prefix of the fictitious voter addresses, from the TEST-NET-1 documentation range (RFC 5737). */
    private static final String VOTER_ADDRESS_PREFIX = "192.0.2.";

    private final IdeaRepository ideas;
    private final VoteRepository votes;
    private final VoterHasher hasher;
    private final Clock clock;
    private final TransactionTemplate transaction;
    private final String datasourceUrl;
    private final String confirmation;

    /**
     * Creates the seeder.
     *
     * @param ideas         idea persistence
     * @param votes         vote persistence
     * @param hasher        keyed hash that turns a fake address into a voter id
     * @param clock         source of the seeding moment, so quest ages are relative to it
     * @param txManager     transaction manager, so one run is all or nothing
     * @param datasourceUrl JDBC URL, checked by the guard before anything is deleted
     * @param confirmation  value of {@code demo.seed.confirm} (environment variable {@code DEMO_SEED_CONFIRM}), which must be {@code wipe}
     */
    public DemoDataSeeder(IdeaRepository ideas, VoteRepository votes, VoterHasher hasher, Clock clock,
                          PlatformTransactionManager txManager, @Value("${spring.datasource.url}") String datasourceUrl,
                          @Value("${demo.seed.confirm:}") String confirmation) {
        this.ideas = ideas;
        this.votes = votes;
        this.hasher = hasher;
        this.clock = clock;
        this.transaction = new TransactionTemplate(txManager);
        this.datasourceUrl = datasourceUrl;
        this.confirmation = confirmation;
    }

    @Override
    public void run(ApplicationArguments args) {
        DemoSeedGuard.requireConfirmation(confirmation);
        DemoSeedGuard.requireLocalDatabase(datasourceUrl);
        var counts = transaction.execute(status -> reset());
        log.warn("Demo profile: the board was reset to {} demo quests with {} votes. Every idea and vote that was there is gone.", counts[0], counts[1]);
    }

    /**
     * Replaces the data with the demo board.
     *
     * @return the number of quests and the number of votes inserted
     */
    private int[] reset() {
        votes.deleteAllInBatch();
        ideas.deleteAllInBatch();

        var voters = voters();
        var now = Instant.now(clock).truncatedTo(ChronoUnit.MICROS);
        var inserted = 0;
        for (var index = 0; index < DemoQuests.ALL.size(); index++) {
            var quest = DemoQuests.ALL.get(index);
            var idea = ideas.save(new Idea(quest.author(), quest.description(), now.minus(quest.age())));
            inserted += castVotes(idea, quest, voters, index);
            ideas.save(idea);
        }
        return new int[]{DemoQuests.ALL.size(), inserted};
    }

    /**
     * Casts the quest's votes from a run of consecutive voters, backs first, so no voter votes twice on one quest. The run starts at a different voter for each quest, which gives the voters different histories.
     */
    private int castVotes(Idea idea, DemoQuests.Quest quest, List<byte[]> voters, int questIndex) {
        var total = quest.backs() + quest.rejects();
        var start = (questIndex * 7) % VOTER_POOL;
        for (var k = 0; k < total; k++) {
            var value = k < quest.backs() ? 1 : -1;
            votes.save(new Vote(idea, voters.get((start + k) % VOTER_POOL), value));
            idea.applyScoreDelta(value);
        }
        return total;
    }

    private List<byte[]> voters() {
        var hashes = new ArrayList<byte[]>(VOTER_POOL);
        for (var n = 1; n <= VOTER_POOL; n++) {
            hashes.add(hasher.hash(VOTER_ADDRESS_PREFIX + n));
        }
        return hashes;
    }
}
