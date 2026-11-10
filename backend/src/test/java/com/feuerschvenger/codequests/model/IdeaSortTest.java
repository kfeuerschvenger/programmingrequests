package com.feuerschvenger.codequests.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("IdeaSort")
class IdeaSortTest {

    @ParameterizedTest
    @ValueSource(strings = {"newest", "NEWEST", " Newest "})
    @DisplayName("parses the wire value ignoring case and padding")
    void parses(String value) {
        assertThat(IdeaSort.fromParam(value)).contains(IdeaSort.NEWEST);
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "id", "score", "createdAt", "newest;drop table ideas", "TOPS"})
    @DisplayName("rejects anything outside the whitelist")
    void rejects(String value) {
        assertThat(IdeaSort.fromParam(value)).isEmpty();
    }

    @Test
    @DisplayName("rejects null")
    void rejectsNull() {
        assertThat(IdeaSort.fromParam(null)).isEmpty();
    }

    @Test
    @DisplayName("ends every ordering in the id so tied pages stay stable")
    void endsInId() {
        for (var sort : IdeaSort.values()) {
            assertThat(sort.toSort().stream().reduce((first, second) -> second).orElseThrow().getProperty()).isEqualTo("id");
        }
    }

    @Test
    @DisplayName("orders top by score first")
    void topOrdersByScore() {
        assertThat(IdeaSort.TOP.toSort().iterator().next().getProperty()).isEqualTo("score");
    }
}
