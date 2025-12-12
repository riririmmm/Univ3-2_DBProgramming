package com.example.demo.project.api.dto;

public record MyBookResponse(
        String isbn13
        // 필요하면 나중에 title, coverUrl 추가
) { }
