package com.example.demo.project.api.dto;

import com.example.demo.project.domain.PageComment;

public record MyPageCommentResponse(
        Long id,
        String isbn13,
        Integer page,
        String comment,
        String createdAt
) {
    public static MyPageCommentResponse from(PageComment c) {
        return new MyPageCommentResponse(
                c.getId(),
                c.getIsbn13(),
                c.getPage(),
                c.getComment(),
                c.getCreatedAt() != null ? c.getCreatedAt().toString() : null
        );
    }
}
