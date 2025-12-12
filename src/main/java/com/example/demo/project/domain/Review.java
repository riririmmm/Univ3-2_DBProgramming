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

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private UserAccount user;

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

    // 생성자도 user 추가해서 새로 정의
    public Review(UserAccount user, String isbn13, Double rating, String overall, Boolean spoiler) {
        this.user = user;
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

    public UserAccount getUser() {
        return user;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setIsbn13(String isbn13) {
        this.isbn13 = isbn13;
    }

    public void setUser(UserAccount user) {
        this.user = user;
    }

    public void setRating(Double rating) {
        this.rating = rating;
    }

    public void setOverall(String overall) {
        this.overall = overall;
    }

    public void setSpoiler(Boolean spoiler) {
        this.spoiler = spoiler;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
