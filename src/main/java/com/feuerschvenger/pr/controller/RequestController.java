package com.feuerschvenger.pr.controller;

import com.feuerschvenger.pr.model.Request;
import com.feuerschvenger.pr.model.helper.RequestJson;
import com.feuerschvenger.pr.model.helper.StatusResponseJson;
import com.feuerschvenger.pr.model.helper.VoteJson;
import com.feuerschvenger.pr.service.RequestService;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("requests")
public class RequestController {

    private final RequestService service;

    public RequestController(RequestService service) {
        this.service = service;
    }

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public List<Request> getAll(@RequestParam Optional<String> sortDir, @RequestParam Optional<String> sortBy) {
        return service.getAll(sortDir, sortBy);
    }

    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public Request getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @PostMapping
    @Transactional
    @ResponseStatus(HttpStatus.CREATED)
    public StatusResponseJson create(@RequestBody RequestJson requestJson) {
        return service.create(requestJson);
    }

    @PostMapping("/vote")
    @ResponseStatus(HttpStatus.OK)
    public StatusResponseJson vote(@RequestBody VoteJson voteJson) {
        return service.vote(voteJson);
    }

}
