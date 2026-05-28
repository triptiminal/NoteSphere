package com.notesplatform.controller;

import com.notesplatform.dto.CommonDTOs.*;
import com.notesplatform.service.AiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    @Autowired private AiService aiService;

    @GetMapping("/summarize/{noteId}")
    public ResponseEntity<ApiResponse> summarize(
            @PathVariable String noteId,
            @AuthenticationPrincipal String userId) {
        String summary = aiService.summarizeNote(noteId);
        return ResponseEntity.ok(new ApiResponse(true, "Summary generated",
                new SummaryResponse(summary)));
    }

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse> chat(
            @RequestBody ChatRequest req,
            @AuthenticationPrincipal String userId) {
        String reply = aiService.chat(req.getMessage(), req.getNoteId());
        return ResponseEntity.ok(new ApiResponse(true, "Response generated",
                new ChatResponse(reply)));
    }
}
