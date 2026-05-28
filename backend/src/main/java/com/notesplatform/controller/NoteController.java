package com.notesplatform.controller;

import com.notesplatform.dto.CommonDTOs.ApiResponse;
import com.notesplatform.dto.NoteDTOs.*;
import com.notesplatform.service.NoteService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/notes")
public class NoteController {

    @Autowired private NoteService noteService;

    // ─── PUBLIC ───────────────────────────────────────────────────────────────

    @GetMapping("/feed")
    public ResponseEntity<ApiResponse> getPublicFeed(
            @AuthenticationPrincipal String userId) {
        var notes = noteService.getPublicFeed(userId);
        return ResponseEntity.ok(new ApiResponse(true, "Feed fetched", notes));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse> searchNotes(
            @RequestParam String keyword,
            @AuthenticationPrincipal String userId) {
        var notes = noteService.searchNotes(keyword, userId);
        return ResponseEntity.ok(new ApiResponse(true, "Search results", notes));
    }

    // ─── AUTHENTICATED ────────────────────────────────────────────────────────

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<ApiResponse> createNote(
            @RequestPart("note") @Valid CreateNoteRequest req,
            @RequestPart(value = "file", required = false) MultipartFile file,
            @AuthenticationPrincipal String userId) {
        var note = noteService.createNote(req, file, userId);
        return ResponseEntity.ok(new ApiResponse(true, "Note created", note));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse> getMyNotes(@AuthenticationPrincipal String userId) {
        var notes = noteService.getMyNotes(userId);
        return ResponseEntity.ok(new ApiResponse(true, "My notes fetched", notes));
    }

    @GetMapping("/my/search")
    public ResponseEntity<ApiResponse> searchMyNotes(
            @RequestParam String keyword,
            @AuthenticationPrincipal String userId) {
        var notes = noteService.searchMyNotes(keyword, userId);
        return ResponseEntity.ok(new ApiResponse(true, "Search results", notes));
    }

    @GetMapping("/{noteId}")
    public ResponseEntity<ApiResponse> getNoteById(
            @PathVariable String noteId,
            @AuthenticationPrincipal String userId) {
        var note = noteService.getNoteById(noteId, userId);
        return ResponseEntity.ok(new ApiResponse(true, "Note fetched", note));
    }

    @PutMapping(value = "/{noteId}", consumes = {"multipart/form-data"})
    public ResponseEntity<ApiResponse> updateNote(
            @PathVariable String noteId,
            @RequestPart("note") UpdateNoteRequest req,
            @RequestPart(value = "file", required = false) MultipartFile file,
            @AuthenticationPrincipal String userId) {
        var note = noteService.updateNote(noteId, req, file, userId);
        return ResponseEntity.ok(new ApiResponse(true, "Note updated", note));
    }

    @DeleteMapping("/{noteId}")
    public ResponseEntity<ApiResponse> deleteNote(
            @PathVariable String noteId,
            @AuthenticationPrincipal String userId) {
        noteService.deleteNote(noteId, userId);
        return ResponseEntity.ok(new ApiResponse(true, "Note deleted", null));
    }

    // ─── VOTING ───────────────────────────────────────────────────────────────

    @PostMapping("/{noteId}/vote")
    public ResponseEntity<ApiResponse> vote(
            @PathVariable String noteId,
            @RequestParam String type,
            @AuthenticationPrincipal String userId) {
        var note = noteService.vote(noteId, type.toUpperCase(), userId);
        return ResponseEntity.ok(new ApiResponse(true, "Vote registered", note));
    }

    // ─── COMMENTS ─────────────────────────────────────────────────────────────

    @PostMapping("/{noteId}/comments")
    public ResponseEntity<ApiResponse> addComment(
            @PathVariable String noteId,
            @Valid @RequestBody CommentRequest req,
            @AuthenticationPrincipal String userId) {
        var comment = noteService.addComment(noteId, req, userId);
        return ResponseEntity.ok(new ApiResponse(true, "Comment added", comment));
    }

    @GetMapping("/{noteId}/comments")
    public ResponseEntity<ApiResponse> getComments(@PathVariable String noteId) {
        List<CommentResponse> comments = noteService.getComments(noteId);
        return ResponseEntity.ok(new ApiResponse(true, "Comments fetched", comments));
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<ApiResponse> deleteComment(
            @PathVariable String commentId,
            @AuthenticationPrincipal String userId) {
        noteService.deleteComment(commentId, userId);
        return ResponseEntity.ok(new ApiResponse(true, "Comment deleted", null));
    }
}
