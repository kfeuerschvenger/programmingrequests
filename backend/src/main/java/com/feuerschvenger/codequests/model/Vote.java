package com.feuerschvenger.codequests.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

/**
 * The vote of one voter on one idea, either {@code 1} or {@code -1}.
 * <p>
 * The voter is identified only by a keyed hash of the client address. The entity has no {@code toString} on purpose, so the hash cannot reach a log line through string concatenation.
 * </p>
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "votes")
public class Vote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idea_id", nullable = false, updatable = false)
    private Idea idea;

    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "voter_hash", nullable = false, updatable = false, length = 32)
    private byte[] voterHash;

    @Column(nullable = false)
    private int value;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /**
     * Creates a vote.
     *
     * @param idea      voted idea
     * @param voterHash HMAC-SHA256 of the voter address, 32 bytes
     * @param value     1 or -1
     */
    public Vote(Idea idea, byte[] voterHash, int value) {
        this.idea = idea;
        this.voterHash = voterHash.clone();
        this.value = value;
    }

    /**
     * Switches the direction of the vote.
     *
     * @param newValue 1 or -1
     */
    public void changeValue(int newValue) {
        this.value = newValue;
    }

    @PrePersist
    void onCreate() {
        var now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
