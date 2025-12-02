package com.example.demo.project.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "review")
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 20, nullable = false)
    private String isbn13;

    @Column(nullable = true)
    private Integer rating;          // 1~5 점

    @Column(nullable = false, columnDefinition = "text")
    private String overall;

    @Column(nullable = false)
    private Boolean spoiler;

    protected Review() {
    }

    public Review(String isbn13, Integer rating, String overall, Boolean spoiler) {
        this.isbn13 = isbn13;
        this.rating = rating;
        this.overall = overall;
        this.spoiler = spoiler;
    }

    public Long getId() {
        return id;
    }

    public String getIsbn13() {
        return isbn13;
    }

    public Integer getRating() {
        return rating;
    }

    public String getOverall() {
        return overall;
    }

    public Boolean getSpoiler() {
        return spoiler;
    }
}
