package com.feuerschvenger.codequests.model.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

/**
 * An idea as the API shows it.
 *
 * @param id          idea identifier
 * @param author      author name, null when anonymous
 * @param description idea text
 * @param createdAt   creation instant, serialised as ISO-8601 in UTC
 * @param score       sum of all votes on the idea
 * @param myVote      the caller's own vote: 1, -1, or 0 when the caller has not voted
 */
@Schema(description = "An idea on the board.")
public record IdeaResponse(
        @Schema(description = "Idea identifier.", example = "42")
        long id,

        @Schema(description = "Author name, null when the idea is anonymous.", example = "Ada the Bold", nullable = true)
        String author,

        @Schema(description = "The quest itself.", example = "Forge a CLI that slays merge conflicts before they reach the main branch.")
        String description,

        @Schema(description = "Creation instant in ISO-8601, UTC.", example = "2026-11-04T18:30:00.123456Z")
        Instant createdAt,

        @Schema(description = "Sum of all votes on the idea.", example = "17")
        int score,

        @Schema(description = "The caller's own vote: 1, -1, or 0 when the caller has not voted.", example = "1", allowableValues = {"-1", "0", "1"})
        int myVote) {
}
