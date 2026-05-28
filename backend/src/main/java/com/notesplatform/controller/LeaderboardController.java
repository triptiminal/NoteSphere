package com.notesplatform.controller;

import com.notesplatform.dto.CommonDTOs.ApiResponse;
import com.notesplatform.service.LeaderboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardController {

    @Autowired private LeaderboardService leaderboardService;

    @GetMapping
    public ResponseEntity<ApiResponse> getLeaderboard() {
        var board = leaderboardService.getLeaderboard();
        return ResponseEntity.ok(new ApiResponse(true, "Leaderboard fetched", board));
    }
}
