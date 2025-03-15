package com.feuerschvenger.pr.service;

import com.feuerschvenger.pr.model.Request;
import com.feuerschvenger.pr.model.helper.RequestJson;
import com.feuerschvenger.pr.repository.RequestRepository;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class RequestServiceImpl implements RequestService {
    private final RequestRepository requestRepository;

    public RequestServiceImpl(RequestRepository requestRepository) {
        this.requestRepository = requestRepository;
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
    public Request create(RequestJson requestJson) {
        ModelMapper modelMapper = new ModelMapper();
        Request newReq = modelMapper.map(requestJson, Request.class);
        return requestRepository.save(newReq);
    }

}
