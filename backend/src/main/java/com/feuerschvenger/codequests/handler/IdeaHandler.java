package com.feuerschvenger.codequests.handler;

import com.feuerschvenger.codequests.model.IdeaSort;
import com.feuerschvenger.codequests.model.dto.CreateIdeaRequest;
import com.feuerschvenger.codequests.model.dto.IdeaPageResponse;
import com.feuerschvenger.codequests.model.dto.IdeaResponse;

/**
 * Facade between the controller and the service. It turns the caller's client address into a voter id, so the layers below never see an address.
 */
public interface IdeaHandler {

    /**
     * Lists ideas one page at a time.
     *
     * @param page          zero-based page number
     * @param size          page size
     * @param sort          whitelisted ordering
     * @param clientAddress caller address as resolved by the server
     */
    IdeaPageResponse list(int page, int size, IdeaSort sort, String clientAddress);

    /**
     * Finds one idea.
     *
     * @param id            idea identifier
     * @param clientAddress caller address as resolved by the server
     */
    IdeaResponse get(long id, String clientAddress);

    /**
     * Creates an idea.
     *
     * @param request validated request
     */
    IdeaResponse create(CreateIdeaRequest request);
}
