package com.feuerschvenger.pr.repository;

import com.feuerschvenger.pr.model.Request;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RequestRepository extends JpaRepository<Request, Long> {
}
