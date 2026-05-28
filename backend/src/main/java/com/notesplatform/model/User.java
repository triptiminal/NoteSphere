package com.notesplatform.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {

    @Id
    private String id;

    private String name;

    @Indexed(unique = true)
    private String email;

    @JsonIgnore
    private String password;

    private String role = "STUDENT"; // STUDENT, ADMIN

    private int contributorScore = 0;

    private String avatarColor; // random color for avatar initials

    private LocalDateTime createdAt = LocalDateTime.now();

    private Set<String> votedNotes = new HashSet<>(); // noteIds voted on
}
