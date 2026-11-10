package com.feuerschvenger.codequests.handler.impl;

import com.feuerschvenger.codequests.handler.IdeaHandler;
import com.feuerschvenger.codequests.model.IdeaSort;
import com.feuerschvenger.codequests.model.dto.CreateIdeaRequest;
import com.feuerschvenger.codequests.model.dto.IdeaPageResponse;
import com.feuerschvenger.codequests.model.dto.IdeaResponse;
import com.feuerschvenger.codequests.service.IdeaService;
import org.springframework.stereotype.Component;

/**
 * Default {@link IdeaHandler}.
 */
@Component
public class IdeaHandlerImpl implements IdeaHandler {

    private final IdeaService service;

    /**
     * Creates the handler.
     */
    public IdeaHandlerImpl(IdeaService service) {
        this.service = service;
    }

    @Override
    public IdeaPageResponse list(int page, int size, IdeaSort sort, byte[] voterHash) {
        return service.list(page, size, sort, voterHash);
    }

    @Override
    public IdeaResponse get(long id, byte[] voterHash) {
        return service.get(id, voterHash);
    }

    @Override
    public IdeaResponse create(CreateIdeaRequest request) {
        return service.create(request);
    }

    @Override
    public IdeaResponse vote(long id, int value, byte[] voterHash) {
        return service.vote(id, value, voterHash);
    }

    @Override
    public IdeaResponse removeVote(long id, byte[] voterHash) {
        return service.removeVote(id, voterHash);
    }
}
