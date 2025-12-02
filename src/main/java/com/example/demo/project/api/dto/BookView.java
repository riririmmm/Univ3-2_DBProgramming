package com.example.demo.project.api.dto;

import java.util.List;

public class BookView {
    private String isbn13;
    private String title;
    private List<String> authors;
    private String publisher;
    private Integer pageCount;
    private String coverUrl;
    private String description;

    public BookView() {
    } // Jackson용 기본 생성자

    public BookView(String isbn13, String title, List<String> authors,
                    String publisher, Integer pageCount, String coverUrl, String description) {
        this.isbn13 = isbn13;
        this.title = title;
        this.authors = authors;
        this.publisher = publisher;
        this.pageCount = pageCount;
        this.coverUrl = coverUrl;
        this.description = description;
    }

    public String getIsbn13() {
        return isbn13;
    }

    public String getTitle() {
        return title;
    }

    public List<String> getAuthors() {
        return authors;
    }

    public String getPublisher() {
        return publisher;
    }

    public Integer getPageCount() {
        return pageCount;
    }

    public String getCoverUrl() {
        return coverUrl;
    }

    public String getDescription() {
        return description;
    }

    public void setIsbn13(String v) {
        this.isbn13 = v;
    }

    public void setTitle(String v) {
        this.title = v;
    }

    public void setAuthors(List<String> v) {
        this.authors = v;
    }

    public void setPublisher(String v) {
        this.publisher = v;
    }

    public void setPageCount(Integer v) {
        this.pageCount = v;
    }

    public void setCoverUrl(String v) {
        this.coverUrl = v;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
