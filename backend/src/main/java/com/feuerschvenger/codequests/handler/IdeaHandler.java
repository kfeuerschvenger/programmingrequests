package com.feuerschvenger.codequests.handler;

import com.feuerschvenger.codequests.model.IdeaSort;
import com.feuerschvenger.codequests.model.dto.CreateIdeaRequest;
import com.feuerschvenger.codequests.model.dto.IdeaPageResponse;
import com.feuerschvenger.codequests.model.dto.IdeaResponse;

/**
 * Facade between the controller and the service. It receives the caller's voter id, never an address, so the layers below never see one.
 */
public interface IdeaHandler {

    /**
     * Lists ideas one page at a time.
     *
     * @param page          zero-based page number
     * @param size          page size
     * @param sort          whitelisted ordering
     * @param voterHash     caller's voter id from the client identity
     */
    IdeaPageResponse list(int page, int size, IdeaSort sort, byte[] voterHash);

    /**
     * Finds one idea.
     *
     * @param id            idea identifier
     * @param voterHash     caller's voter id from the client identity
     */
    IdeaResponse get(long id, byte[] voterHash);

    /**
     * Creates an idea.
     *
     * @param request validated request
     */
    IdeaResponse create(CreateIdeaRequest request);

    /**
     * Records the caller's vote.
     *
     * @param id            idea identifier
     * @param value         1 or -1
     * @param voterHash     caller's voter id from the client identity
     */
    IdeaResponse vote(long id, int value, byte[] voterHash);

    /**
     * Removes the caller's vote.
     *
     * @param id            idea identifier
     * @param voterHash     caller's voter id from the client identity
     */
    IdeaResponse removeVote(long id, byte[] voterHash);
}
