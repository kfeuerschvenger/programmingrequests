package com.feuerschvenger.codequests.handler.impl;

import com.feuerschvenger.codequests.handler.IdeaHandler;
import com.feuerschvenger.codequests.model.IdeaSort;
import com.feuerschvenger.codequests.model.dto.CreateIdeaRequest;
import com.feuerschvenger.codequests.model.dto.IdeaPageResponse;
import com.feuerschvenger.codequests.model.dto.IdeaResponse;
import com.feuerschvenger.codequests.security.VoterHasher;
import com.feuerschvenger.codequests.service.IdeaService;
import org.springframework.stereotype.Component;

/**
 * Default {@link IdeaHandler}.
 */
@Component
public class IdeaHandlerImpl implements IdeaHandler {

    private final IdeaService service;
    private final VoterHasher voterHasher;

    /**
     * Creates the handler.
     */
    public IdeaHandlerImpl(IdeaService service, VoterHasher voterHasher) {
        this.service = service;
        this.voterHasher = voterHasher;
    }

    @Override
    public IdeaPageResponse list(int page, int size, IdeaSort sort, String clientAddress) {
        return service.list(page, size, sort, voterHasher.hash(clientAddress));
    }

    @Override
    public IdeaResponse get(long id, String clientAddress) {
        return service.get(id, voterHasher.hash(clientAddress));
    }

    @Override
    public IdeaResponse create(CreateIdeaRequest request) {
        return service.create(request);
    }

    @Override
    public IdeaResponse vote(long id, int value, String clientAddress) {
        return service.vote(id, value, voterHasher.hash(clientAddress));
    }

    @Override
    public IdeaResponse removeVote(long id, String clientAddress) {
        return service.removeVote(id, voterHasher.hash(clientAddress));
    }
}
