package com.notesplatform.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

public class NoteDTOs {

    @Data
    public static class CreateNoteRequest {
        @NotBlank(message = "Title is required")
        private String title;

        @NotBlank(message = "Subject is required")
        private String subject;

        private String content;

        private List<String> tags;

        @JsonProperty("isPublic")
        private boolean isPublic = true;
    }

    @Data
    public static class UpdateNoteRequest {
        private String title;
        private String subject;
        private String content;
        private List<String> tags;

        @JsonProperty("isPublic")
        private Boolean isPublic;
    }

    @Data
    public static class NoteResponse {
        private String id;
        private String title;
        private String subject;
        private String content;
        private String authorId;
        private String authorName;
        private String fileName;
        private String fileType;
        private String fileUrl;
        private boolean hasFile;
        private int upvotes;
        private int downvotes;
        private String aiSummary;
        private boolean isPublic;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private List<String> tags;
        private String userVote;
        private long commentCount;
    }

    @Data
    public static class CommentRequest {
        @NotBlank(message = "Comment content is required")
        private String content;
    }

    @Data
    public static class CommentResponse {
        private String id;
        private String noteId;
        private String authorId;
        private String authorName;
        private String content;
        private LocalDateTime createdAt;
    }
}