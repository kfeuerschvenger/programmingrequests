package com.feuerschvenger.codequests.demo;

import com.feuerschvenger.codequests.support.MySqlIntegrationSupport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;

@SpringBootTest
@ActiveProfiles("demo")
@DisplayName("DemoDataSeeder")
class DemoDataSeederIntegrationTest extends MySqlIntegrationSupport {

    @Autowired
    private DemoDataSeeder seeder;

    @Autowired
    private JdbcTemplate jdbc;

    @BeforeEach
    void seed() {
        seeder.run(new DefaultApplicationArguments());
    }

    private long count(String table) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM " + table, Long.class);
    }

    @Test
    @DisplayName("creates every demo quest with its votes")
    void createsTheBoard() {
        var expectedVotes = DemoQuests.ALL.stream().mapToInt(quest -> quest.backs() + quest.rejects()).sum();

        assertThat(count("ideas")).isEqualTo(DemoQuests.ALL.size());
        assertThat(count("votes")).isEqualTo(expectedVotes);
    }

    @Test
    @DisplayName("keeps the score of each quest equal to the sum of its votes")
    void scoresMatchVotes() {
        var mismatched = jdbc.queryForObject(
                "SELECT COUNT(*) FROM ideas i WHERE i.score <> COALESCE((SELECT SUM(v.value) FROM votes v WHERE v.idea_id = i.id), 0)",
                Long.class);
        var scores = jdbc.queryForList("SELECT score FROM ideas", Integer.class);

        assertThat(mismatched).isZero();
        assertThat(scores).containsExactlyInAnyOrderElementsOf(DemoQuests.ALL.stream().map(DemoQuests.Quest::score).toList());
        assertThat(scores).anyMatch(score -> score < 0).anyMatch(score -> score > 0);
    }

    @Test
    @DisplayName("holds two anonymous quests and one that is close to the description limit")
    void shapesOfTheData() {
        var lengths = jdbc.queryForList("SELECT CHAR_LENGTH(description) FROM ideas", Integer.class);

        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM ideas WHERE author IS NULL", Long.class)).isEqualTo(2);
        assertThat(lengths).allMatch(length -> length >= 10 && length <= 1000);
        assertThat(lengths).anyMatch(length -> length >= 950);
    }

    @Test
    @DisplayName("spreads the creation dates over the last week, all in the past")
    void datesAreSpread() {
        var span = jdbc.queryForObject("SELECT TIMESTAMPDIFF(HOUR, MIN(created_at), MAX(created_at)) FROM ideas", Long.class);
        var future = jdbc.queryForObject("SELECT COUNT(*) FROM ideas WHERE created_at > UTC_TIMESTAMP(6)", Long.class);

        assertThat(span).isBetween(100L, 168L);
        assertThat(future).isZero();
    }

    @Test
    @DisplayName("never stores a voter hash twice on one quest")
    void votersAreDistinctPerQuest() {
        var duplicates = jdbc.queryForObject(
                "SELECT COUNT(*) FROM (SELECT idea_id, voter_hash FROM votes GROUP BY idea_id, voter_hash HAVING COUNT(*) > 1) d", Long.class);

        assertThat(duplicates).isZero();
    }

    @Test
    @DisplayName("is idempotent: a second run leaves the same rows and removes whatever was added")
    void idempotent() {
        jdbc.update("INSERT INTO ideas (author, description, created_at, score) VALUES ('Intruder', 'A quest that must not survive a reset', UTC_TIMESTAMP(6), 0)");
        var before = descriptions();

        seeder.run(new DefaultApplicationArguments());

        assertThat(count("ideas")).isEqualTo(DemoQuests.ALL.size());
        assertThat(descriptions()).doesNotContain("A quest that must not survive a reset");
        assertThat(descriptions()).containsExactlyInAnyOrderElementsOf(DemoQuests.ALL.stream().map(DemoQuests.Quest::description).toList());
        assertThat(before).hasSize(DemoQuests.ALL.size() + 1);
    }

    @Test
    @DisplayName("holds the headline quest and the long quest the captures look for")
    void captureAnchorsExist() {
        assertThat(descriptions()).anyMatch(text -> text.startsWith(DemoQuests.HEADLINE));
        assertThat(descriptions()).anyMatch(text -> text.startsWith(DemoQuests.LONG_QUEST_START));
    }

    private List<String> descriptions() {
        return jdbc.queryForList("SELECT description FROM ideas", String.class);
    }

    @Test
    @DisplayName("refuses to run against a database that is not local, and deletes nothing")
    void refusesRemoteDatabase() {
        var remote = new DemoDataSeeder(null, null, null, null, mock(PlatformTransactionManager.class), "jdbc:mysql://prod-db.example.com:3306/code_quests");

        assertThatThrownBy(() -> remote.run(new DefaultApplicationArguments())).isInstanceOf(IllegalStateException.class);
        assertThat(count("ideas")).isEqualTo(DemoQuests.ALL.size());
    }
}
