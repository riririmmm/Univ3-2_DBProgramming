package com.example.demo.project.api.dto;

import com.example.demo.project.domain.Review;

public record MyReviewResponse(
        Long id,
        String isbn13,
        Double rating,
        String overall,
        boolean spoiler,
        String createdAt
) {
    public static MyReviewResponse from(Review r) {
        return new MyReviewResponse(
                r.getId(),
                r.getIsbn13(),
                r.getRating(),
                r.getOverall(),
                Boolean.TRUE.equals(r.getSpoiler()),
                r.getCreatedAt() != null ? r.getCreatedAt().toString() : null
        );
    }
}
