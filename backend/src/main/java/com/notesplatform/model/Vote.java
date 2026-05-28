//package com.notesplatform.model;
//
//import lombok.Data;
//import lombok.NoArgsConstructor;
//import lombok.AllArgsConstructor;
//import org.springframework.data.annotation.Id;
//import org.springframework.data.mongodb.core.mapping.Document;
//
//import java.time.LocalDateTime;
//
//@Data
//@NoArgsConstructor
//@AllArgsConstructor
//@Document(collection = "votes")
//public class Vote {
//
//    @Id
//    private String id;
//
//    private String noteId;
//
//    private String userId;
//
//    private String voteType; // UPVOTE or DOWNVOTE
//
//    private LocalDateTime createdAt = LocalDateTime.now();
//}
package com.notesplatform.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "votes")
@CompoundIndex(name = "note_user_unique", def = "{'noteId': 1, 'userId': 1}", unique = true)
public class Vote {

    @Id
    private String id;

    private String noteId;

    private String userId;

    private String voteType; // UPVOTE or DOWNVOTE

    private LocalDateTime createdAt = LocalDateTime.now();
}
