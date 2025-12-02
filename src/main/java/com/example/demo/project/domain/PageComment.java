package com.example.demo.project.domain;

import jakarta.persistence.*;

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

    protected PageComment() {}

    public PageComment(String isbn13, Integer page, String comment) {
        this.isbn13 = isbn13;
        this.page = page;
        this.comment = comment;
    }

    public Long getId() { return id; }
    public String getIsbn13() { return isbn13; }
    public Integer getPage() { return page; }
    public String getComment() { return comment; }
}
