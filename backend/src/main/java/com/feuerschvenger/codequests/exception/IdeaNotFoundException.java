package com.feuerschvenger.codequests.exception;

/**
 * Raised when an idea id does not exist. The message is fixed text: the id is not included, so nothing the client sent is echoed back.
 */
public class IdeaNotFoundException extends RuntimeException {

    /** Creates the exception. */
    public IdeaNotFoundException() {
        super("Idea not found");
    }
}
