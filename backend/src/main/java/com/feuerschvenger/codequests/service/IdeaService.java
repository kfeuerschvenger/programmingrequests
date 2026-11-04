package com.feuerschvenger.codequests.service;

import com.feuerschvenger.codequests.model.IdeaSort;
import com.feuerschvenger.codequests.model.dto.CreateIdeaRequest;
import com.feuerschvenger.codequests.model.dto.IdeaPageResponse;
import com.feuerschvenger.codequests.model.dto.IdeaResponse;

/**
 * Business operations on ideas. Entities never leave this layer: every method returns a DTO.
 */
public interface IdeaService {

    /**
     * Lists ideas one page at a time.
     *
     * @param page      zero-based page number
     * @param size      page size
     * @param sort      whitelisted ordering
     * @param voterHash HMAC of the caller's address, used to fill {@code myVote}
     */
    IdeaPageResponse list(int page, int size, IdeaSort sort, byte[] voterHash);

    /**
     * Finds one idea.
     *
     * @param id        idea identifier
     * @param voterHash HMAC of the caller's address
     * @throws com.feuerschvenger.codequests.exception.IdeaNotFoundException when the idea does not exist
     */
    IdeaResponse get(long id, byte[] voterHash);

    /**
     * Creates an idea with a score of zero and a server-side date.
     *
     * @param request validated request
     */
    IdeaResponse create(CreateIdeaRequest request);
}
