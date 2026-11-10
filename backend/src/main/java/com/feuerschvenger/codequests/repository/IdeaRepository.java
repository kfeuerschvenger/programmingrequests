package com.feuerschvenger.codequests.repository;

import com.feuerschvenger.codequests.model.Idea;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Persistence for {@link Idea}.
 */
@Repository
public interface IdeaRepository extends JpaRepository<Idea, Long> {

    /**
     * Loads an idea and takes a write lock on its row until the transaction ends. Votes on one idea queue behind this lock, so the score and the vote rows change as one serial sequence.
     *
     * @param id idea identifier
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select i from Idea i where i.id = :id")
    Optional<Idea> findByIdForUpdate(@Param("id") Long id);
}
