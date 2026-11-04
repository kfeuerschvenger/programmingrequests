package com.feuerschvenger.codequests.model.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

/**
 * One page of ideas. It is a record of its own so the JSON shape does not depend on Spring Data's page implementation.
 *
 * @param items      ideas on this page
 * @param page       zero-based page number
 * @param size       requested page size
 * @param totalItems number of ideas on all pages
 * @param totalPages number of pages
 */
@Schema(description = "One page of ideas.")
public record IdeaPageResponse(
        @Schema(description = "Ideas on this page.")
        List<IdeaResponse> items,

        @Schema(description = "Zero-based page number.", example = "0")
        int page,

        @Schema(description = "Requested page size.", example = "20")
        int size,

        @Schema(description = "Number of ideas on all pages.", example = "137")
        long totalItems,

        @Schema(description = "Number of pages.", example = "7")
        int totalPages) {
}
