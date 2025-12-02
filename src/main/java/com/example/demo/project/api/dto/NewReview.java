package com.example.demo.project.api.dto;

public class NewReview {
    private String overall;
    private Boolean spoiler;
    private Integer rating;

    public NewReview() {
    }

    public NewReview(String overall, Boolean spoiler, Integer rating) {
        this.overall = overall;
        this.spoiler = spoiler;
    }

    public String getOverall() {
        return overall;
    }

    public Boolean getSpoiler() {
        return spoiler;
    }

    public Integer getRating() {
        return rating;
    }

    public void setOverall(String overall) {
        this.overall = overall;
    }

    public void setSpoiler(Boolean spoiler) {
        this.spoiler = spoiler;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

}
