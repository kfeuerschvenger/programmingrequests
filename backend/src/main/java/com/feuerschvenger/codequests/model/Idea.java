package com.feuerschvenger.codequests.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * A programming idea submitted by a visitor.
 * <p>
 * The score is the sum of the votes on the idea. It is only changed through {@link #applyScoreDelta(int)}, inside the transaction that also changes the vote rows.
 * </p>
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "ideas")
public class Idea {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 60)
    private String author;

    @Column(nullable = false, length = 1000)
    private String description;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private int score;

    /**
     * Creates a new idea with a score of zero.
     *
     * @param author      optional author name, null when anonymous
     * @param description idea text
     * @param createdAt   creation instant, set by the server
     */
    public Idea(String author, String description, Instant createdAt) {
        this.author = author;
        this.description = description;
        this.createdAt = createdAt;
        this.score = 0;
    }

    /**
     * Adds a vote delta to the score.
     *
     * @param delta signed change, for example 1, -1 or 2 when a vote switches direction
     */
    public void applyScoreDelta(int delta) {
        this.score += delta;
    }
}
