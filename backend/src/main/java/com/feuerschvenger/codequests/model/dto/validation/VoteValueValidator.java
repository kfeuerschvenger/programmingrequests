package com.feuerschvenger.codequests.model.dto.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * Accepts only 1, -1 or null.
 */
public class VoteValueValidator implements ConstraintValidator<VoteValue, Integer> {

    @Override
    public boolean isValid(Integer value, ConstraintValidatorContext context) {
        return value == null || value == 1 || value == -1;
    }
}
