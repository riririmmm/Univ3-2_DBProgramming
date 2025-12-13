package com.example.demo.project.domain;

import jakarta.persistence.*;

@Entity
@Table(
        name = "book_progress",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "isbn13"})
)
public class BookProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private UserAccount user;

    @Column(length = 20, nullable = false)
    private String isbn13;

    @Column(nullable = false)
    private Integer currentPage = 0;

    protected BookProgress() {
    }

    public BookProgress(UserAccount user, String isbn13, Integer currentPage) {
        this.user = user;
        this.isbn13 = isbn13;
        this.currentPage = currentPage;
    }

    public Long getId() {
        return id;
    }

    public UserAccount getUser() {
        return user;
    }

    public String getIsbn13() {
        return isbn13;
    }

    public Integer getCurrentPage() {
        return currentPage;
    }

    public void setCurrentPage(Integer currentPage) {
        this.currentPage = currentPage;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setUser(UserAccount user) {
        this.user = user;
    }

    public void setIsbn13(String isbn13) {
        this.isbn13 = isbn13;
    }
}
