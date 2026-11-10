package com.feuerschvenger.codequests.demo;

import java.time.Duration;
import java.util.List;

/**
 * The quests the demo profile pins to the board.
 * <p>
 * They are app ideas written in the voice of the site, spread over the last week, with a vote tally each so the board shows a range of scores, negative ones included. The list is newest first. Two quests are anonymous and one runs close to the description limit, so the board shows the collapsed text, the "Read more" toggle and the anonymous byline. No author is a real person.
 * </p>
 */
final class DemoQuests {

    /**
     * One demo quest.
     *
     * @param author      author name, null for an anonymous quest
     * @param description quest text, at most 1000 characters
     * @param age         how long before the seeding moment the quest was posted
     * @param backs       number of fictitious voters who back it
     * @param rejects     number of fictitious voters who reject it
     */
    record Quest(String author, String description, Duration age, int backs, int rejects) {

        /** The score the quest must end with: backs minus rejects. */
        int score() {
            return backs - rejects;
        }
    }

    /** The quest every capture asserts on: it is the newest one, so it heads the board. */
    static final String HEADLINE = "Medieval-like CAPTCHA: prove you are human by picking the picture with the suspicious peasant.";

    /** The quest long enough to be clamped, which shows the "Read more" toggle. */
    static final String LONG_QUEST_START = "The Grand Ledger of Quests";

    static final List<Quest> ALL = List.of(
            new Quest("Dame Nullpointer",
                    HEADLINE + " Bonus points when the wrong answers are all dragons wearing a trench coat.",
                    Duration.ofHours(2), 24, 3),
            new Quest("Brannoc the Unbranched",
                    "Dragon-proof password vault. Every secret is sealed in wax and guarded by a very polite wyvern, who opens the gate only after three riddles about your own pet's name.",
                    Duration.ofHours(9), 19, 2),
            new Quest("Wulfric the Linter",
                    "Tavern-grade kanban boards. Columns are Ordered, Brewing, Served and Spilled, cards are drawn on coasters, and the WIP limit is however many tankards fit on one arm. A rowdy cousin of BreezyBoard.",
                    Duration.ofHours(26), 14, 1),
            new Quest("Pip the Intern",
                    "A pomodoro timer with mandatory tavern breaks. Twenty-five minutes of focus, then a bard forces you to stand up, drink some water and listen to one verse about your last failing build.",
                    Duration.ofHours(44), 11, 4),
            new Quest("Ysolde of the Stack",
                    "A regex explainer. Paste a spell such as ^(?:[a-z0-9]+\\.)+[a-z]{2,}$ and it reads it back in plain speech, in the voice of a wizard who has seen too many pull requests.",
                    Duration.ofHours(54), 8, 0),
            new Quest("Sir Lag-a-lot",
                    "An expense splitter for adventuring parties. Who paid for the inn, who owes for the dragon's share, and why does the bard always claim the lute was a business expense?",
                    Duration.ofHours(67), 6, 3),
            new Quest("Old Man Cron",
                    "A habit tracker where every streak is a wax seal. Miss a day and the seal cracks in front of you, with a tiny sound effect and a small, personal disappointment.",
                    Duration.ofHours(80), 5, 4),
            new Quest(null,
                    "A weather app that predicts dragon moods. Cloudy with a chance of fire, a gentle drizzle of ash, and a stern warning for anyone planning a picnic near the mountain.",
                    Duration.ofHours(94), 3, 3),
            new Quest("Gideon of the Third Standup",
                    "A markdown editor that outputs illuminated manuscripts. Every heading gets a gilded capital letter, every code block a tiny monk, and every bullet list a very long procession.",
                    Duration.ofHours(106), 4, 7),
            new Quest("Mira, keeper of merge conflicts",
                    "A dungeon-crawler roguelike where every floor is a unit test. Green means the stairs open, red means the floor collapses, and the final boss is a flaky integration test that only appears on Tuesdays.",
                    Duration.ofHours(120), 7, 1),
            new Quest("Captain Semicolon",
                    LONG_QUEST_START + ": a guild-hall dashboard where every member declares what they slew yesterday, what they will slay today, and what blocks the dragon-slaying. "
                            + "It should collect the declarations each morning at the third bell, group them by party, and highlight any blocker repeated for more than two days with a small red wax seal on the scroll. "
                            + "The ledger must keep a quiet history, so a captain can look back across a whole season and see which quests ended in glory and which ended in a tavern. "
                            + "It must work offline in a dungeon with no signal, sync when the hero climbs back into daylight, and never lose a scroll, even when two heroes edit the same declaration at once: "
                            + "then it keeps both versions and lets the captain settle it with a duel, a coin toss or, if the realm feels modern, a polite comment. "
                            + "Finally, it exports the whole season as one illuminated PDF for the annual feast, with a page of honourable mentions for whoever fixed the build.",
                    Duration.ofHours(138), 12, 2),
            new Quest(null,
                    "A linter that speaks only in prophecy. Thou shalt not shadow a variable, for the scope remembers, and the unused import shall be cast into the outer darkness.",
                    Duration.ofHours(156), 1, 8));

    private DemoQuests() {
    }
}
