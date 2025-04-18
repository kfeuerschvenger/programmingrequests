package com.feuerschvenger.pr.service;

import com.feuerschvenger.pr.model.Request;
import com.feuerschvenger.pr.model.Vote;
import com.feuerschvenger.pr.model.helper.RequestJson;
import com.feuerschvenger.pr.model.helper.StatusResponseJson;
import com.feuerschvenger.pr.model.helper.VoteJson;
import com.feuerschvenger.pr.repository.RequestRepository;
import com.feuerschvenger.pr.repository.VoteRepository;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@Service
public class RequestServiceImpl implements RequestService {
    private final RequestRepository requestRepository;
    private final VoteRepository voteRepository;

    public RequestServiceImpl(RequestRepository requestRepository, VoteRepository voteRepository) {
        this.requestRepository = requestRepository;
        this.voteRepository = voteRepository;
    }

    @Override
    public List<Request> getAll(Optional<String> sortDir, Optional<String> sortBy) {
        Sort.Direction dir = Sort.Direction.fromString(sortDir.orElse("DESC"));
        String sortProp = sortBy.orElse("id");
        return requestRepository.findAll(Sort.by(dir, sortProp));
    }

    @Override
    public Request getById(Long id) {
        Optional<Request> result = requestRepository.findById(id);
        return result.orElse(null);
    }

    @Override
    public StatusResponseJson create(RequestJson requestJson) {
        ModelMapper modelMapper = new ModelMapper();
        Request newReq = modelMapper.map(requestJson, Request.class);
        StatusResponseJson response = new StatusResponseJson();
        try {
            requestRepository.save(newReq);
            response.setStatus(StatusResponseJson.Status.OK);
            return response;
        } catch (Exception e) {
            response.setStatus(StatusResponseJson.Status.ERROR);
            return response;
        }
    }

    @Override
    public StatusResponseJson vote(VoteJson voteJson) {
        StatusResponseJson response = new StatusResponseJson();
        Optional<Request> req = requestRepository.findById(voteJson.getRequestId());
        if (!req.isPresent()) {
            response.setStatus(StatusResponseJson.Status.ERROR);
            response.setTitle("Voting not allowed");
            response.setMessage("Idea request not found");
            return response;
        }

        Request existingreq = req.get();

        Optional<Vote> existing = voteRepository.findByIpAddressAndValueAndRequest_Id(voteJson.getIpAddress(), voteJson.getValue(), voteJson.getRequestId());
        if (existing.isPresent()) {
            response.setStatus(StatusResponseJson.Status.ERROR);
            response.setTitle("Voting not allowed");
            response.setMessage("Seems like you already voted for this idea");
            return response;
        }

        Optional<Vote> existingOposite = voteRepository.findByIpAddressAndValueAndRequest_Id(voteJson.getIpAddress(), -voteJson.getValue(), voteJson.getRequestId());
        if (existingOposite.isPresent()) {
            voteRepository.delete(existingOposite.get());
        } else {
            ModelMapper modelMapper = new ModelMapper();
            Vote newVote = modelMapper.map(voteJson, Vote.class);
            newVote.setId(null);
            newVote.setRequest(existingreq);
            voteRepository.save(newVote);
        }

        int upVotes = existingreq.getUpVotes() + voteJson.getValue();
        existingreq.setUpVotes(upVotes);
        requestRepository.save(existingreq);

        response.setStatus(StatusResponseJson.Status.OK);
        return response;
    }

}
