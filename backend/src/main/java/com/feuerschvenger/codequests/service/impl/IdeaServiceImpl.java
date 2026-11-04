package com.feuerschvenger.codequests.service.impl;

import com.feuerschvenger.codequests.exception.IdeaNotFoundException;
import com.feuerschvenger.codequests.mapper.IdeaMapper;
import com.feuerschvenger.codequests.model.Idea;
import com.feuerschvenger.codequests.model.IdeaSort;
import com.feuerschvenger.codequests.model.dto.CreateIdeaRequest;
import com.feuerschvenger.codequests.model.dto.IdeaPageResponse;
import com.feuerschvenger.codequests.model.dto.IdeaResponse;
import com.feuerschvenger.codequests.repository.IdeaRepository;
import com.feuerschvenger.codequests.repository.IdeaVote;
import com.feuerschvenger.codequests.repository.VoteRepository;
import com.feuerschvenger.codequests.service.IdeaService;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Default {@link IdeaService}.
 */
@Service
public class IdeaServiceImpl implements IdeaService {

    private final IdeaRepository ideaRepository;
    private final VoteRepository voteRepository;
    private final IdeaMapper mapper;
    private final Clock clock;

    /**
     * Creates the service.
     */
    public IdeaServiceImpl(IdeaRepository ideaRepository, VoteRepository voteRepository, IdeaMapper mapper, Clock clock) {
        this.ideaRepository = ideaRepository;
        this.voteRepository = voteRepository;
        this.mapper = mapper;
        this.clock = clock;
    }

    @Override
    @Transactional(readOnly = true)
    public IdeaPageResponse list(int page, int size, IdeaSort sort, byte[] voterHash) {
        var result = ideaRepository.findAll(PageRequest.of(page, size, sort.toSort()));
        return mapper.toPageResponse(result, votesOf(voterHash, result.getContent()));
    }

    @Override
    @Transactional(readOnly = true)
    public IdeaResponse get(long id, byte[] voterHash) {
        var idea = ideaRepository.findById(id).orElseThrow(IdeaNotFoundException::new);
        var myVote = voteRepository.findByIdea_IdAndVoterHash(id, voterHash).map(vote -> vote.getValue()).orElse(0);
        return mapper.toResponse(idea, myVote);
    }

    @Override
    @Transactional
    public IdeaResponse create(CreateIdeaRequest request) {
        // DATETIME(6) keeps microseconds, so the instant is cut to the same precision the database will return.
        var now = clock.instant().truncatedTo(ChronoUnit.MICROS);
        var saved = ideaRepository.save(mapper.toEntity(request, now));
        return mapper.toResponse(saved, 0);
    }

    private Map<Long, Integer> votesOf(byte[] voterHash, List<Idea> ideas) {
        if (ideas.isEmpty()) {
            return Map.of();
        }
        var ids = ideas.stream().map(Idea::getId).toList();
        return voteRepository.findVotesOfVoter(voterHash, ids).stream()
                .collect(Collectors.toMap(IdeaVote::getIdeaId, IdeaVote::getValue));
    }
}
