package com.notesplatform.controller;

import com.notesplatform.dto.AuthDTOs.*;
import com.notesplatform.dto.CommonDTOs.ApiResponse;
import com.notesplatform.model.User;
import com.notesplatform.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse> register(@Valid @RequestBody RegisterRequest req) {
        AuthResponse res = authService.register(req);
        return ResponseEntity.ok(new ApiResponse(true, "Registration successful", res));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse> login(@Valid @RequestBody LoginRequest req) {
        AuthResponse res = authService.login(req);
        return ResponseEntity.ok(new ApiResponse(true, "Login successful", res));
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse> getProfile(@AuthenticationPrincipal String userId) {
        User user = authService.getProfile(userId);
        user.setPassword(null); // never expose password
        return ResponseEntity.ok(new ApiResponse(true, "Profile fetched", user));
    }
}
