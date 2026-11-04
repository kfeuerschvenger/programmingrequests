package com.feuerschvenger.codequests.controller;

import com.feuerschvenger.codequests.handler.IdeaHandler;
import com.feuerschvenger.codequests.model.IdeaSort;
import com.feuerschvenger.codequests.model.dto.CreateIdeaRequest;
import com.feuerschvenger.codequests.model.dto.IdeaPageResponse;
import com.feuerschvenger.codequests.model.dto.IdeaResponse;
import com.feuerschvenger.codequests.model.dto.VoteRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

/**
 * HTTP contract for ideas under {@code /api/ideas}. The controller only reads the request and delegates to the handler.
 * <p>
 * The caller's address is {@link HttpServletRequest#getRemoteAddr()}. Tomcat's remote IP valve has already replaced it with the {@code X-Forwarded-For} value when, and only when, the request came from a trusted proxy, so the controller never reads that header itself.
 * </p>
 */
@RestController
@RequestMapping("/api/ideas")
@Tag(name = "Ideas", description = "Submit quests for the realm and cast votes on them.")
public class IdeaController {

    private static final String PROBLEM_JSON = MediaType.APPLICATION_PROBLEM_JSON_VALUE;

    private final IdeaHandler handler;

    /**
     * Creates the controller.
     */
    public IdeaController(IdeaHandler handler) {
        this.handler = handler;
    }

    /**
     * Lists ideas one page at a time.
     */
    @GetMapping
    @Operation(summary = "List ideas", description = "Returns one page of ideas. Each item carries the caller's own vote in myVote.")
    @ApiResponse(responseCode = "200", description = "A page of ideas, possibly empty.")
    @ApiResponse(responseCode = "400", description = "A paging or sort parameter is out of range.",
            content = @Content(mediaType = PROBLEM_JSON, schema = @Schema(implementation = ProblemDetail.class)))
    public IdeaPageResponse list(
            @Parameter(description = "Zero-based page number.", example = "0")
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @Parameter(description = "Page size, from 1 to 50.", example = "20")
            @RequestParam(defaultValue = "20") @Min(1) @Max(50) int size,
            @Parameter(description = "Ordering: newest, oldest or top.", example = "top")
            @RequestParam(defaultValue = "newest") IdeaSort sort,
            HttpServletRequest request) {
        return handler.list(page, size, sort, request.getRemoteAddr());
    }

    /**
     * Returns one idea.
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get an idea", description = "Returns one idea with the caller's own vote.")
    @ApiResponse(responseCode = "200", description = "The idea.")
    @ApiResponse(responseCode = "404", description = "No idea has that id. The lost quest is not on the board.",
            content = @Content(mediaType = PROBLEM_JSON, schema = @Schema(implementation = ProblemDetail.class)))
    public IdeaResponse get(@Parameter(description = "Idea identifier.", example = "42") @PathVariable long id,
                            HttpServletRequest request) {
        return handler.get(id, request.getRemoteAddr());
    }

    /**
     * Creates an idea.
     */
    @PostMapping
    @Operation(summary = "Submit an idea", description = "Adds an idea to the board with a score of zero. Any score or date in the body is ignored.")
    @ApiResponse(responseCode = "201", description = "The idea was created. The Location header points at it.")
    @ApiResponse(responseCode = "400", description = "The body is malformed or a field is not valid.",
            content = @Content(mediaType = PROBLEM_JSON, schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "429", description = "Too many ideas from this address. Retry-After says how long to rest.",
            content = @Content(mediaType = PROBLEM_JSON, schema = @Schema(implementation = ProblemDetail.class)))
    public ResponseEntity<IdeaResponse> create(@Valid @RequestBody CreateIdeaRequest body) {
        var created = handler.create(body);
        return ResponseEntity.created(URI.create("/api/ideas/" + created.id())).body(created);
    }

    /**
     * Records the caller's vote.
     */
    @PutMapping("/{id}/vote")
    @Operation(summary = "Cast a vote", description = "Sets the caller's vote to 1 or -1. Voting the same value again changes nothing, and the opposite value switches the vote.")
    @ApiResponse(responseCode = "200", description = "The idea with its updated score and the caller's vote.")
    @ApiResponse(responseCode = "400", description = "The value is missing or is not 1 or -1.",
            content = @Content(mediaType = PROBLEM_JSON, schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "404", description = "No idea has that id.",
            content = @Content(mediaType = PROBLEM_JSON, schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "429", description = "Too many votes from this address. Retry-After says how long to rest.",
            content = @Content(mediaType = PROBLEM_JSON, schema = @Schema(implementation = ProblemDetail.class)))
    public IdeaResponse vote(@Parameter(description = "Idea identifier.", example = "42") @PathVariable long id,
                             @Valid @RequestBody VoteRequest body,
                             HttpServletRequest request) {
        return handler.vote(id, body.value(), request.getRemoteAddr());
    }

    /**
     * Removes the caller's vote.
     */
    @DeleteMapping("/{id}/vote")
    @Operation(summary = "Withdraw a vote", description = "Removes the caller's vote. It changes nothing when the caller has not voted.")
    @ApiResponse(responseCode = "200", description = "The idea with its updated score and myVote of 0.")
    @ApiResponse(responseCode = "404", description = "No idea has that id.",
            content = @Content(mediaType = PROBLEM_JSON, schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "429", description = "Too many votes from this address. Retry-After says how long to rest.",
            content = @Content(mediaType = PROBLEM_JSON, schema = @Schema(implementation = ProblemDetail.class)))
    public IdeaResponse removeVote(@Parameter(description = "Idea identifier.", example = "42") @PathVariable long id,
                                   HttpServletRequest request) {
        return handler.removeVote(id, request.getRemoteAddr());
    }
}
