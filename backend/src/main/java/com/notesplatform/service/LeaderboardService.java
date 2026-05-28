package com.notesplatform.service;

import com.notesplatform.dto.CommonDTOs.LeaderboardEntry;
import com.notesplatform.repository.NoteRepository;
import com.notesplatform.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class LeaderboardService {

    @Autowired private UserRepository userRepository;
    @Autowired private NoteRepository noteRepository;

    public List<LeaderboardEntry> getLeaderboard() {
        var users = userRepository.findAllByOrderByContributorScoreDesc();
        List<LeaderboardEntry> board = new ArrayList<>();
        int rank = 1;
        for (var u : users) {
            if (u.getContributorScore() > 0 || noteRepository.countByAuthorId(u.getId()) > 0) {
                LeaderboardEntry e = new LeaderboardEntry();
                e.setUserId(u.getId());
                e.setName(u.getName());
                e.setAvatarColor(u.getAvatarColor());
                e.setContributorScore(u.getContributorScore());
                e.setNoteCount(noteRepository.countByAuthorId(u.getId()));
                e.setRank(rank++);
                board.add(e);
            }
        }
        return board;
    }
}
