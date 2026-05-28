package com.notesplatform.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notes")
public class Note {

    @Id
    private String id;

    private String title;

    private String subject;

    private String content;

    private String authorId;

    private String authorName;

    // ── Cloudinary fields ─────────────────────────────────────────────────────
    private String fileUrl;          // full Cloudinary secure_url
    private String filePublicId;     // Cloudinary public_id  (for deletion)
    private String fileResourceType; // "image" or "raw"      (for deletion API)
    private String fileName;         // original filename shown to user
    private String fileType;         // MIME type e.g. application/pdf

    private int upvotes = 0;

    private int downvotes = 0;

    private String aiSummary;       // cached AI summary

    private boolean isPublic = true;

    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt = LocalDateTime.now();

    private List<String> tags = new ArrayList<>();
}
