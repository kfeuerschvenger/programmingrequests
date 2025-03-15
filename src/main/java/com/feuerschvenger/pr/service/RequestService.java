package com.feuerschvenger.pr.service;

import com.feuerschvenger.pr.model.Request;
import com.feuerschvenger.pr.model.helper.RequestJson;

import java.util.List;
import java.util.Optional;

public interface RequestService {

    List<Request> getAll(Optional<String> sortDir, Optional<String> sortBy);
    Request getById(Long id);
    Request create(RequestJson requestJson);
}
