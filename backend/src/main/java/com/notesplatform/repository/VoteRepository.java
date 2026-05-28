package com.notesplatform.repository;

import com.notesplatform.model.Vote;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface VoteRepository extends MongoRepository<Vote, String> {
    Optional<Vote> findByNoteIdAndUserId(String noteId, String userId);
    boolean existsByNoteIdAndUserId(String noteId, String userId);
    void deleteByNoteId(String noteId);

}
