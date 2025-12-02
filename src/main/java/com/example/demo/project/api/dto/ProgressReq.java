package com.example.demo.project.api.dto;

public class ProgressReq {
    private Integer currentPage;
    public ProgressReq() {}
    public ProgressReq(Integer currentPage) { this.currentPage = currentPage; }
    public Integer getCurrentPage() { return currentPage; }
    public void setCurrentPage(Integer currentPage) { this.currentPage = currentPage; }
}
