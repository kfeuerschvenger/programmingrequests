package com.feuerschvenger.codequests.model.dto;

import com.feuerschvenger.codequests.model.dto.validation.VoteValue;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

/**
 * Body of {@code PUT /api/ideas/{id}/vote}.
 *
 * @param value 1 for an upvote, -1 for a downvote
 */
@Schema(description = "A vote on an idea.")
public record VoteRequest(
        @Schema(description = "1 to upvote, -1 to downvote.", example = "1", allowableValues = {"-1", "1"})
        @NotNull
        @VoteValue
        Integer value) {
}
