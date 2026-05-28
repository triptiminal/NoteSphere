package com.notesplatform.service;

import com.notesplatform.dto.NoteDTOs.*;
import com.notesplatform.exception.AppException;
import com.notesplatform.model.Comment;
import com.notesplatform.model.Note;
import com.notesplatform.model.User;
import com.notesplatform.model.Vote;
import com.notesplatform.repository.CommentRepository;
import com.notesplatform.repository.NoteRepository;
import com.notesplatform.repository.UserRepository;
import com.notesplatform.repository.VoteRepository;
import com.notesplatform.service.CloudinaryService.CloudinaryUploadResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class NoteService {

    @Autowired private NoteRepository    noteRepository;
    @Autowired private UserRepository    userRepository;
    @Autowired private CommentRepository commentRepository;
    @Autowired private VoteRepository    voteRepository;
    @Autowired private CloudinaryService cloudinaryService;

    // ─── CREATE ───────────────────────────────────────────────────────────────

    public NoteResponse createNote(CreateNoteRequest req, MultipartFile file, String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));

        Note note = new Note();
        note.setTitle(req.getTitle());
        note.setSubject(req.getSubject());
        note.setContent(req.getContent() != null ? req.getContent() : "");
        note.setAuthorId(userId);
        note.setAuthorName(user.getName());
        note.setPublic(req.isPublic());
        note.setTags(req.getTags() != null ? req.getTags() : new ArrayList<>());

        if (file != null && !file.isEmpty()) {
            CloudinaryUploadResult result = cloudinaryService.upload(file);
            note.setFileUrl(result.secureUrl());
            note.setFilePublicId(result.publicId());
            note.setFileResourceType(result.resourceType());
            note.setFileName(file.getOriginalFilename());
            note.setFileType(file.getContentType());
        }

        note = noteRepository.save(note);
        return toResponse(note, userId);
    }

    // ─── UPDATE ───────────────────────────────────────────────────────────────

    public NoteResponse updateNote(String noteId, UpdateNoteRequest req,
                                   MultipartFile file, String userId) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new AppException("Note not found", HttpStatus.NOT_FOUND));
        if (!note.getAuthorId().equals(userId)) {
            throw new AppException("Access denied", HttpStatus.FORBIDDEN);
        }

        if (req.getTitle()    != null) note.setTitle(req.getTitle());
        if (req.getSubject()  != null) note.setSubject(req.getSubject());
        if (req.getContent()  != null) note.setContent(req.getContent());
        if (req.getTags()     != null) note.setTags(req.getTags());
        if (req.getIsPublic() != null) note.setPublic(req.getIsPublic());
        note.setUpdatedAt(LocalDateTime.now());

        if (file != null && !file.isEmpty()) {
            cloudinaryService.delete(note.getFilePublicId(), note.getFileResourceType());
            CloudinaryUploadResult result = cloudinaryService.upload(file);
            note.setFileUrl(result.secureUrl());
            note.setFilePublicId(result.publicId());
            note.setFileResourceType(result.resourceType());
            note.setFileName(file.getOriginalFilename());
            note.setFileType(file.getContentType());
        }

        note = noteRepository.save(note);
        return toResponse(note, userId);
    }

    // ─── DELETE ───────────────────────────────────────────────────────────────

    public void deleteNote(String noteId, String userId) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new AppException("Note not found", HttpStatus.NOT_FOUND));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));

        if (!note.getAuthorId().equals(userId) && !"ADMIN".equals(user.getRole())) {
            throw new AppException("Access denied", HttpStatus.FORBIDDEN);
        }

        cloudinaryService.delete(note.getFilePublicId(), note.getFileResourceType());
        commentRepository.deleteByNoteId(noteId);
        voteRepository.deleteByNoteId(noteId);
        noteRepository.delete(note);
    }

    // ─── READ ─────────────────────────────────────────────────────────────────

    public NoteResponse getNoteById(String noteId, String userId) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new AppException("Note not found", HttpStatus.NOT_FOUND));
//        if (!note.isPublic() && !note.getAuthorId().equals(userId)) {
//            throw new AppException("Access denied", HttpStatus.FORBIDDEN);
//        }
        return toResponse(note, userId);
    }

    public List<NoteResponse> getMyNotes(String userId) {
        return noteRepository.findByAuthorIdOrderByCreatedAtDesc(userId)
                .stream().map(n -> toResponse(n, userId)).toList();
    }

    public List<NoteResponse> getPublicFeed(String userId) {
        return noteRepository.findByIsPublicTrueOrderByCreatedAtDesc()
                .stream().map(n -> toResponse(n, userId)).toList();
    }

    public List<NoteResponse> searchNotes(String keyword, String userId) {
        return noteRepository.searchPublicNotes(keyword)
                .stream().map(n -> toResponse(n, userId)).toList();
    }

    public List<NoteResponse> searchMyNotes(String keyword, String userId) {
        return noteRepository.searchMyNotes(userId, keyword)
                .stream().map(n -> toResponse(n, userId)).toList();
    }

    // ─── VOTE ─────────────────────────────────────────────────────────────────

    public NoteResponse vote(String noteId, String voteType, String userId) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new AppException("Note not found", HttpStatus.NOT_FOUND));
        if (note.getAuthorId().equals(userId)) {
            throw new AppException("You cannot vote on your own note", HttpStatus.BAD_REQUEST);
        }

        Optional<Vote> existingVote = voteRepository.findByNoteIdAndUserId(noteId, userId);

        if (existingVote.isPresent()) {
            Vote ev = existingVote.get();
            if (ev.getVoteType().equals(voteType)) {
                voteRepository.delete(ev);
                if ("UPVOTE".equals(voteType)) { note.setUpvotes(Math.max(0, note.getUpvotes()-1)); adjustScore(note.getAuthorId(),-2); }
                else                            { note.setDownvotes(Math.max(0, note.getDownvotes()-1)); adjustScore(note.getAuthorId(),1); }
            } else {
                if ("UPVOTE".equals(voteType)) { note.setUpvotes(note.getUpvotes()+1); note.setDownvotes(Math.max(0,note.getDownvotes()-1)); adjustScore(note.getAuthorId(),3); }
                else                            { note.setDownvotes(note.getDownvotes()+1); note.setUpvotes(Math.max(0,note.getUpvotes()-1)); adjustScore(note.getAuthorId(),-3); }
                ev.setVoteType(voteType);
                voteRepository.save(ev);
            }
        } else {
            Vote v = new Vote();
            v.setNoteId(noteId); v.setUserId(userId); v.setVoteType(voteType);
            voteRepository.save(v);
            if ("UPVOTE".equals(voteType)) { note.setUpvotes(note.getUpvotes()+1); adjustScore(note.getAuthorId(),2); }
            else                            { note.setDownvotes(note.getDownvotes()+1); adjustScore(note.getAuthorId(),-1); }
        }

        note = noteRepository.save(note);
        return toResponse(note, userId);
    }

    // ─── COMMENTS ─────────────────────────────────────────────────────────────

    public CommentResponse addComment(String noteId, CommentRequest req, String userId) {
        noteRepository.findById(noteId)
                .orElseThrow(() -> new AppException("Note not found", HttpStatus.NOT_FOUND));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));
        Comment comment = new Comment();
        comment.setNoteId(noteId);
        comment.setAuthorId(userId);
        comment.setAuthorName(user.getName());
        comment.setContent(req.getContent());
        return toCommentResponse(commentRepository.save(comment));
    }

    public List<CommentResponse> getComments(String noteId) {
        return commentRepository.findByNoteIdOrderByCreatedAtDesc(noteId)
                .stream().map(this::toCommentResponse).toList();
    }

    public void deleteComment(String commentId, String userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new AppException("Comment not found", HttpStatus.NOT_FOUND));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));
        if (!comment.getAuthorId().equals(userId) && !"ADMIN".equals(user.getRole())) {
            throw new AppException("Access denied", HttpStatus.FORBIDDEN);
        }
        commentRepository.delete(comment);
    }

    public void saveAiSummary(String noteId, String summary) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new AppException("Note not found", HttpStatus.NOT_FOUND));
        note.setAiSummary(summary);
        noteRepository.save(note);
    }

    // ─── HELPERS ──────────────────────────────────────────────────────────────

    private void adjustScore(String authorId, int delta) {
        userRepository.findById(authorId).ifPresent(u -> {
            u.setContributorScore(Math.max(0, u.getContributorScore() + delta));
            userRepository.save(u);
        });
    }

    private NoteResponse toResponse(Note note, String userId) {
        NoteResponse r = new NoteResponse();
        r.setId(note.getId());
        r.setTitle(note.getTitle());
        r.setSubject(note.getSubject());
        r.setContent(note.getContent());
        r.setAuthorId(note.getAuthorId());
        r.setAuthorName(note.getAuthorName());
        r.setFileName(note.getFileName());
        r.setFileType(note.getFileType());
        r.setFileUrl(note.getFileUrl());
        r.setHasFile(note.getFileUrl() != null);
        r.setUpvotes(note.getUpvotes());
        r.setDownvotes(note.getDownvotes());
        r.setAiSummary(note.getAiSummary());
        r.setPublic(note.isPublic());
        r.setCreatedAt(note.getCreatedAt());
        r.setUpdatedAt(note.getUpdatedAt());
        r.setTags(note.getTags());
        r.setCommentCount(commentRepository.countByNoteId(note.getId()));
//        if (userId != null) {
//            voteRepository.findByNoteIdAndUserId(note.getId(), userId)
//                    .ifPresent(v -> r.setUserVote(v.getVoteType()));
//        }
//        return r;
        try {
            voteRepository.findByNoteIdAndUserId(note.getId(), userId)
                    .ifPresent(v -> r.setUserVote(v.getVoteType()));
        } catch (Exception e) {
            // duplicate vote entry - ignore
        }
        return r;
    }

    private CommentResponse toCommentResponse(Comment c) {
        CommentResponse r = new CommentResponse();
        r.setId(c.getId()); r.setNoteId(c.getNoteId());
        r.setAuthorId(c.getAuthorId()); r.setAuthorName(c.getAuthorName());
        r.setContent(c.getContent()); r.setCreatedAt(c.getCreatedAt());
        return r;
    }
}
