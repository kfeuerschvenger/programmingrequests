package com.feuerschvenger.codequests.model.dto.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * The annotated integer must be 1 or -1. A null value is left to {@code @NotNull}.
 */
@Documented
@Constraint(validatedBy = VoteValueValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
public @interface VoteValue {

    /** Message used when the value is rejected. The API replaces it with a bundle text. */
    String message() default "must be 1 or -1";

    /** Validation groups. */
    Class<?>[] groups() default {};

    /** Payload. */
    Class<? extends Payload>[] payload() default {};
}
