package com.example.demo.project.domain;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "page_comment")
public class PageComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 20, nullable = false)
    private String isbn13;

    @Column(nullable = false)
    private Integer page;

    @Column(nullable = false, columnDefinition = "text")
    private String comment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    protected PageComment() {
    }

    public PageComment(String isbn13, Integer page, String comment, UserAccount user) {
        this.isbn13 = isbn13;
        this.page = page;
        this.comment = comment;
        this.user = user;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getIsbn13() {
        return isbn13;
    }

    public Integer getPage() {
        return page;
    }

    public String getComment() {
        return comment;
    }

    public UserAccount getUser() {
        return user;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setIsbn13(String isbn13) {
        this.isbn13 = isbn13;
    }

    public void setPage(Integer page) {
        this.page = page;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public void setUser(UserAccount user) {
        this.user = user;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
