package com.feuerschvenger.codequests.repository;

import com.feuerschvenger.codequests.model.Idea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Persistence for {@link Idea}.
 */
@Repository
public interface IdeaRepository extends JpaRepository<Idea, Long> {
}
