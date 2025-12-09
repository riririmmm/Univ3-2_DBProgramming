package com.example.demo.project.api.dto;

import java.time.LocalDateTime;

public class NewReview {
    private String overall;
    private Boolean spoiler;
    private Double rating;
    private LocalDateTime createdAt;

    public NewReview() {
    }

    public NewReview(String overall, Boolean spoiler, double rating, LocalDateTime createdAt) {
        this.overall = overall;
        this.spoiler = spoiler;
        this.rating = rating;
        this.createdAt = createdAt;
    }

    public String getOverall() {
        return overall;
    }

    public Boolean getSpoiler() {
        return spoiler;
    }

    public Double getRating() {
        return rating;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setOverall(String overall) {
        this.overall = overall;
    }

    public void setSpoiler(Boolean spoiler) {
        this.spoiler = spoiler;
    }

    public void setRating(Double rating) {
        this.rating = rating;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
