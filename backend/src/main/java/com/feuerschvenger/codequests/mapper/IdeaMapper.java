package com.feuerschvenger.codequests.mapper;

import com.feuerschvenger.codequests.model.Idea;
import com.feuerschvenger.codequests.model.dto.CreateIdeaRequest;
import com.feuerschvenger.codequests.model.dto.IdeaPageResponse;
import com.feuerschvenger.codequests.model.dto.IdeaResponse;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;

/**
 * Converts between {@link Idea} entities and DTOs.
 * <p>
 * The mapping is written by hand so that every field that crosses the boundary is explicit: a request can only carry the fields of its record, and a response is assembled field by field from the entity.
 * </p>
 */
@Component
public class IdeaMapper {

    /**
     * Builds a new entity from a creation request. The score starts at zero and the date comes from the server.
     *
     * @param request validated request
     * @param now     creation instant
     */
    public Idea toEntity(CreateIdeaRequest request, Instant now) {
        return new Idea(request.author(), request.description(), now);
    }

    /**
     * Builds the response for one idea.
     *
     * @param idea   entity
     * @param myVote the caller's vote on this idea: 1, -1 or 0
     */
    public IdeaResponse toResponse(Idea idea, int myVote) {
        return new IdeaResponse(idea.getId(), idea.getAuthor(), idea.getDescription(), idea.getCreatedAt(), idea.getScore(), myVote);
    }

    /**
     * Builds the response for a page of ideas.
     *
     * @param page    the page of entities
     * @param myVotes the caller's votes keyed by idea id, missing ids mean no vote
     */
    public IdeaPageResponse toPageResponse(Page<Idea> page, Map<Long, Integer> myVotes) {
        var items = page.getContent().stream()
                .map(idea -> toResponse(idea, myVotes.getOrDefault(idea.getId(), 0)))
                .toList();
        return new IdeaPageResponse(items, page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
    }
}
