package com.notesplatform.repository;

import com.notesplatform.model.Comment;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface CommentRepository extends MongoRepository<Comment, String> {
    List<Comment> findByNoteIdOrderByCreatedAtDesc(String noteId);
    long countByNoteId(String noteId);
    void deleteByNoteId(String noteId);
}
