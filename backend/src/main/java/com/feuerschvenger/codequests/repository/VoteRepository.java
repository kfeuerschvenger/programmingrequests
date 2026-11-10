package com.feuerschvenger.codequests.repository;

import com.feuerschvenger.codequests.model.Vote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Persistence for {@link Vote}.
 */
@Repository
public interface VoteRepository extends JpaRepository<Vote, Long> {

    /**
     * Finds the vote of one voter on one idea.
     *
     * @param ideaId    idea identifier
     * @param voterHash HMAC of the voter address
     */
    Optional<Vote> findByIdea_IdAndVoterHash(Long ideaId, byte[] voterHash);

    /**
     * Loads the votes of one voter on many ideas with a single query, which is how a page of ideas learns the caller's own votes without one query per idea.
     *
     * @param voterHash HMAC of the voter address
     * @param ideaIds   identifiers of the ideas on the page
     */
    @Query("select v.idea.id as ideaId, v.value as value from Vote v where v.voterHash = :voterHash and v.idea.id in :ideaIds")
    List<IdeaVote> findVotesOfVoter(@Param("voterHash") byte[] voterHash, @Param("ideaIds") Collection<Long> ideaIds);
}
