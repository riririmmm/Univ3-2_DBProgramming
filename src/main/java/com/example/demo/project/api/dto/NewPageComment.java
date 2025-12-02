package com.example.demo.project.api.dto;

public class NewPageComment {
    private Integer page;
    private String comment;

    public NewPageComment() {}
    public NewPageComment(Integer page, String comment) {
        this.page = page; this.comment = comment;
    }
    public Integer getPage() { return page; }
    public String getComment() { return comment; }
    public void setPage(Integer page) { this.page = page; }
    public void setComment(String comment) { this.comment = comment; }
}
