package com.feuerschvenger.codequests.repository;

/**
 * Projection of a vote for the list query: just the idea id and the value, without loading entities.
 */
public interface IdeaVote {

    /** Identifier of the voted idea. */
    Long getIdeaId();

    /** The vote, 1 or -1. */
    int getValue();
}
