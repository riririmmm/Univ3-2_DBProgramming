package com.example.demo.project.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "book_progress")
public class BookProgress {

    @Id
    @Column(length = 20)
    private String isbn13;          // 한 책당 한 줄

    @Column(nullable = false)
    private Integer currentPage = 0;

    protected BookProgress() {}

    public BookProgress(String isbn13, Integer currentPage) {
        this.isbn13 = isbn13;
        this.currentPage = currentPage;
    }

    public String getIsbn13() { return isbn13; }
    public Integer getCurrentPage() { return currentPage; }
    public void setCurrentPage(Integer currentPage) { this.currentPage = currentPage; }
}
