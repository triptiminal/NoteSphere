package com.notesplatform.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

public class CommonDTOs {

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ApiResponse {
        private boolean success;
        private String message;
        private Object data;

        public ApiResponse(boolean success, String message) {
            this.success = success;
            this.message = message;
        }
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class LeaderboardEntry {
        private String userId;
        private String name;
        private String avatarColor;
        private int contributorScore;
        private long noteCount;
        private int rank;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ChatRequest {
        private String message;
        private String noteId; // optional — if asking about a specific note
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ChatResponse {
        private String reply;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class SummaryResponse {
        private String summary;
    }
}
