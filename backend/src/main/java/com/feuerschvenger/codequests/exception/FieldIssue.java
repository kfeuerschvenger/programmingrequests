package com.feuerschvenger.codequests.exception;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * One validation failure: the name of the field and a fixed message. The rejected value is never included.
 *
 * @param field   name of the request field or parameter
 * @param message fixed text from the message bundle
 */
@Schema(description = "One validation failure. It names the field, never the rejected value.")
public record FieldIssue(
        @Schema(description = "Name of the request field or parameter.", example = "description")
        String field,
        @Schema(description = "What is wrong with the field.", example = "Must be between 10 and 1000 characters.")
        String message) {
}
