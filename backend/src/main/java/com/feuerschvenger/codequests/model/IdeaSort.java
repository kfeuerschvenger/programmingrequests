package com.feuerschvenger.codequests.model;

import org.springframework.data.domain.Sort;

import java.util.Locale;
import java.util.Optional;

/**
 * The orderings a client may request for the idea list.
 * <p>
 * The values are a closed whitelist, so a client can never name an entity property to sort by. Every ordering ends in the id, which keeps pages stable when scores or dates tie.
 * </p>
 */
public enum IdeaSort {

    NEWEST(Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"))),
    OLDEST(Sort.by(Sort.Order.asc("createdAt"), Sort.Order.asc("id"))),
    TOP(Sort.by(Sort.Order.desc("score"), Sort.Order.desc("createdAt"), Sort.Order.desc("id")));

    private final Sort sort;

    IdeaSort(Sort sort) {
        this.sort = sort;
    }

    /**
     * Returns the Spring Data ordering for this value.
     */
    public Sort toSort() {
        return sort;
    }

    /**
     * Parses the lower-case wire value, ignoring case.
     *
     * @param value request parameter text
     * @return the matching sort, or empty when the text is not on the whitelist
     */
    public static Optional<IdeaSort> fromParam(String value) {
        if (value == null) {
            return Optional.empty();
        }
        try {
            return Optional.of(valueOf(value.strip().toUpperCase(Locale.ROOT)));
        } catch (IllegalArgumentException unknown) {
            return Optional.empty();
        }
    }
}
