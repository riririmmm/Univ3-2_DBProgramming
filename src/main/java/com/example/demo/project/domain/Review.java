package com.example.demo.project.domain;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "review")
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 20, nullable = false)
    private String isbn13;

    @Column(nullable = true)
    private Double rating;          // 1~5 점

    @Column(nullable = false, columnDefinition = "text")
    private String overall;

    @Column(nullable = false)
    private Boolean spoiler;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    protected Review() {
    }

    public Review(String isbn13, Double rating, String overall, Boolean spoiler) {
        this.isbn13 = isbn13;
        this.rating = rating;
        this.overall = overall;
        this.spoiler = spoiler;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getIsbn13() {
        return isbn13;
    }

    public Double getRating() {
        return rating;
    }

    public String getOverall() {
        return overall;
    }

    public Boolean getSpoiler() {
        return spoiler;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
