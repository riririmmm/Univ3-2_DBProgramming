package com.example.demo.project.web;

import com.example.demo.project.api.dto.ReviewResponse;
import com.example.demo.project.domain.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/books")
public class ReviewApiController {

    private final ReviewRepository reviewRepository;

    // 여러 개 리뷰 목록 조회 (별점 평균 아님!)
    @GetMapping("/{isbn13}/reviews")
    public List<ReviewResponse> getReviews(@PathVariable String isbn13) {
        return reviewRepository.findByIsbn13(isbn13).stream()
                .map(ReviewResponse::from)
                .toList();
    }

}
