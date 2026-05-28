package com.notesplatform.repository;

import com.notesplatform.model.Note;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;

public interface NoteRepository extends MongoRepository<Note, String> {
    List<Note> findByAuthorIdOrderByCreatedAtDesc(String authorId);
    List<Note> findByIsPublicTrueOrderByCreatedAtDesc();
    List<Note> findByIsPublicTrueOrderByUpvotesDesc();

    @Query("{ 'isPublic': true, $or: [ { 'title': { $regex: ?0, $options: 'i' } }, { 'subject': { $regex: ?0, $options: 'i' } }, { 'content': { $regex: ?0, $options: 'i' } } ] }")
    List<Note> searchPublicNotes(String keyword);

    @Query("{ 'authorId': ?0, $or: [ { 'title': { $regex: ?1, $options: 'i' } }, { 'subject': { $regex: ?1, $options: 'i' } } ] }")
    List<Note> searchMyNotes(String authorId, String keyword);

    List<Note> findBySubjectIgnoreCaseAndIsPublicTrue(String subject);

    long countByAuthorId(String authorId);
}
