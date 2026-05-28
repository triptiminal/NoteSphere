package com.notesplatform.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.notesplatform.exception.AppException;
import com.notesplatform.model.Note;
import com.notesplatform.repository.NoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class AiService {

    @Value("${ai.api.url}")
    private String aiApiUrl;

    @Value("${ai.api.key}")
    private String aiApiKey;

    @Value("${ai.model}")
    private String aiModel;

    @Autowired private NoteRepository noteRepository;
    @Autowired private ObjectMapper objectMapper;

    public String summarizeNote(String noteId) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new AppException("Note not found", HttpStatus.NOT_FOUND));

        if (note.getAiSummary() != null && !note.getAiSummary().isBlank()) {
            return note.getAiSummary();
        }

        String text = buildNoteText(note);
        if (text.isBlank()) {
            throw new AppException("Note has no content to summarize", HttpStatus.BAD_REQUEST);
        }

        String prompt = "You are an academic assistant. Summarize the following study note concisely, " +
                "highlighting key concepts, main ideas, and important points. " +
                "Keep it under 200 words.\n\nNote Title: " + note.getTitle() +
                "\nSubject: " + note.getSubject() + "\n\nContent:\n" + text;

        String summary = callAi("You are an academic assistant.", prompt);

        note.setAiSummary(summary);
        noteRepository.save(note);
        return summary;
    }

    public String chat(String userMessage, String noteId) {
        String systemPrompt = "You are a helpful academic assistant for students. " +
                "Answer questions clearly and concisely. " +
                "Focus on academic topics, study help, and educational content. " +
                "If asked about non-academic topics, politely redirect to academic subjects.";

        String noteContext = "";
        if (noteId != null && !noteId.isBlank()) {
            Note note = noteRepository.findById(noteId).orElse(null);
            if (note != null) {
                noteContext = "Context from the note I'm studying:\n" +
                        "Title: " + note.getTitle() + "\n" +
                        "Subject: " + note.getSubject() + "\n" +
                        "Content: " + buildNoteText(note);
            }
        }

        String fullMessage = !noteContext.isBlank()
                ? noteContext + "\n\nMy question: " + userMessage
                : userMessage;

        return callAi(systemPrompt, fullMessage);
    }

    // ─── PRIVATE ──────────────────────────────────────────────────────────────

    private String callAi(String systemMessage, String userMessage) {
        try {
            RestTemplate restTemplate = new RestTemplate();

            // Groq uses Bearer token like OpenAI
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(aiApiKey);

            // OpenAI-compatible request format (works for Groq)
            ObjectNode body = objectMapper.createObjectNode();
            body.put("model", aiModel);
            body.put("max_tokens", 1000);

            ArrayNode messages = body.putArray("messages");

            ObjectNode sysMsg = messages.addObject();
            sysMsg.put("role", "system");
            sysMsg.put("content", systemMessage);

            ObjectNode userMsg = messages.addObject();
            userMsg.put("role", "user");
            userMsg.put("content", userMessage);

            HttpEntity<String> entity = new HttpEntity<>(body.toString(), headers);
            ResponseEntity<String> response = restTemplate.postForEntity(aiApiUrl, entity, String.class);

            // OpenAI-compatible response format
            JsonNode root = objectMapper.readTree(response.getBody());
            return root.path("choices")
                    .get(0)
                    .path("message")
                    .path("content")
                    .asText();

        } catch (Exception e) {
            e.printStackTrace();
            throw new AppException("AI service unavailable: " + e.getMessage(),
                    HttpStatus.SERVICE_UNAVAILABLE);
        }
    }

    private String buildNoteText(Note note) {
        if (note.getContent() != null && !note.getContent().isBlank()) {
            return note.getContent().trim();
        }
        if (note.getFileUrl() != null) {
            return "(This note has an attached " + note.getFileType() + " file but no additional text content.)";
        }
        return "";
    }
}