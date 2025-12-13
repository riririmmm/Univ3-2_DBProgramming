package com.example.demo.project.api.dto;

import com.example.demo.project.domain.Review;

public record ReviewResponse(
        Long id,
        String authorNickname,
        String overall,
        boolean spoiler,
        Double rating,
        String createdAt
) {
    public static ReviewResponse from(Review r) {
        return new ReviewResponse(
                r.getId(),
                r.getUser() != null ? r.getUser().getNickname() : null,
                r.getOverall(),
                Boolean.TRUE.equals(r.getSpoiler()),
                r.getRating(),
                r.getCreatedAt() != null ? r.getCreatedAt().toString() : null
        );
    }
}
