package com.example.demo.project.api.dto;

public record MyReviewUpdateRequest(
        Double rating,
        String overall,
        Boolean spoiler
) { }
