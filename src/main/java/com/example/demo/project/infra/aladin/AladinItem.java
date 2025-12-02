package com.example.demo.project.infra.aladin;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class AladinItem {
    private String title;
    private String author;
    private String publisher;
    private String isbn13;
    private String cover;
    private String description;

    private Integer itemPage;

    private SubInfo subInfo;

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SubInfo {
        private Integer itemPage;

        public Integer getItemPage() {
            return itemPage;
        }

        public void setItemPage(Integer itemPage) {
            this.itemPage = itemPage;
        }
    }

    // getters/setters ...
    public String getTitle() {
        return title;
    }

    public void setTitle(String v) {
        this.title = v;
    }

    public String getAuthor() {
        return author;
    }

    public void setAuthor(String v) {
        this.author = v;
    }

    public String getPublisher() {
        return publisher;
    }

    public void setPublisher(String v) {
        this.publisher = v;
    }

    public String getIsbn13() {
        return isbn13;
    }

    public void setIsbn13(String v) {
        this.isbn13 = v;
    }

    public String getCover() {
        return cover;
    }

    public void setCover(String v) {
        this.cover = v;
    }

    public Integer getItemPage() {
        return itemPage;
    }

    public void setItemPage(Integer v) {
        this.itemPage = v;
    }

    public SubInfo getSubInfo() {
        return subInfo;
    }

    public void setSubInfo(SubInfo subInfo) {
        this.subInfo = subInfo;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getResolvedPageCount() {
        if (itemPage != null)
            return itemPage;
        return (subInfo != null) ? subInfo.getItemPage() : null;
    }
}
