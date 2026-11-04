package com.feuerschvenger.codequests.model.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Body of {@code POST /api/ideas}.
 * <p>
 * The record has no score and no date, so a client cannot set either: unknown properties are ignored when the body is read. Both fields are trimmed on construction, and a blank author becomes null.
 * </p>
 *
 * @param author      optional author name, up to 60 characters
 * @param description the idea, 10 to 1000 characters
 */
@Schema(description = "A new idea to put on the board.")
public record CreateIdeaRequest(
        @Schema(description = "Who is behind the idea. Leave it out to stay anonymous.", example = "Ada the Bold", maxLength = 60, nullable = true)
        @Size(max = 60)
        String author,

        @Schema(description = "The quest itself.", example = "Forge a CLI that slays merge conflicts before they reach the main branch.", minLength = 10, maxLength = 1000)
        @NotBlank
        @Size(min = 10, max = 1000)
        String description) {

    /**
     * Trims both fields and turns a blank author into null.
     */
    public CreateIdeaRequest {
        author = author == null || author.isBlank() ? null : author.strip();
        description = description == null ? null : description.strip();
    }
}
