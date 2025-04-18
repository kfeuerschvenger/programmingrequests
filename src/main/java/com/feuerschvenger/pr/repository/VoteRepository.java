package com.feuerschvenger.pr.repository;

import com.feuerschvenger.pr.model.Vote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VoteRepository extends JpaRepository<Vote, Long> {

    Optional<Vote> findByIpAddressAndValueAndRequest_Id(String ipAddress, int value, Long id);

}
