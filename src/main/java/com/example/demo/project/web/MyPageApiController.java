package com.example.demo.project.web;

import com.example.demo.project.api.dto.*;
import com.example.demo.project.domain.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/me")
public class MyPageApiController {

    private final UserAccountRepository userAccountRepository;
    private final ReviewRepository reviewRepository;
    private final PageCommentRepository pageCommentRepository;
    private final BookProgressRepository bookProgressRepository;

    private UserAccount getCurrentUser(Authentication authentication) {
        String username = authentication.getName();
        return userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("로그인 유저를 찾을 수 없습니다."));
    }

    // 1) 내가 리뷰 남긴 책 목록 (isbn13 중복 제거)
    @GetMapping("/books")
    public List<MyBookResponse> getMyBooks(Authentication authentication) {
        UserAccount me = getCurrentUser(authentication);

        List<Review> myReviews = reviewRepository.findByUserOrderByCreatedAtDesc(me);

        Set<String> isbnSet = myReviews.stream()
                .map(Review::getIsbn13)
                .collect(Collectors.toSet());

        return isbnSet.stream()
                .map(MyBookResponse::new)
                .toList();
    }

    // 2) 내가 쓴 리뷰 목록
    @GetMapping("/reviews")
    public List<MyReviewResponse> getMyReviews(Authentication authentication) {
        UserAccount me = getCurrentUser(authentication);

        return reviewRepository.findByUserOrderByCreatedAtDesc(me).stream()
                .map(MyReviewResponse::from)
                .toList();
    }

    // 2-1) 특정 책에 대해 내가 쓴 리뷰만 조회 (모달용)
    @GetMapping("/books/{isbn13}/reviews")
    public List<MyReviewResponse> getMyReviewsForBook(@PathVariable String isbn13,
                                                      Authentication authentication) {
        UserAccount me = getCurrentUser(authentication);

        return reviewRepository.findByUserAndIsbn13OrderByCreatedAtDesc(me, isbn13)
                .stream()
                .map(MyReviewResponse::from)
                .toList();
    }

    // 3) 리뷰 수정
    @PatchMapping("/reviews/{id}")
    public void updateMyReview(@PathVariable Long id,
                               @RequestBody MyReviewUpdateRequest req,
                               Authentication authentication) {
        UserAccount me = getCurrentUser(authentication);
        Review r = reviewRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (!r.getUser().getId().equals(me.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        r.setRating(req.rating());
        r.setOverall(req.overall());
        r.setSpoiler(req.spoiler());

        reviewRepository.save(r);
    }

    // 4) 리뷰 삭제
    @DeleteMapping("/reviews/{id}")
    public void deleteMyReview(@PathVariable Long id,
                               Authentication authentication) {
        UserAccount me = getCurrentUser(authentication);
        Review r = reviewRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (!r.getUser().getId().equals(me.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        reviewRepository.delete(r);
    }

    // 5) 내가 쓴 페이지 코멘트 목록
    @GetMapping("/page-comments")
    public List<MyPageCommentResponse> getMyPageComments(Authentication authentication) {
        UserAccount me = getCurrentUser(authentication);
        return pageCommentRepository.findByUserOrderByCreatedAtDesc(me).stream()
                .map(MyPageCommentResponse::from)
                .toList();
    }

    // 5-1) 특정 책에 대해 내가 쓴 페이지 코멘트만 (마이페이지 모달용)
    @GetMapping("/books/{isbn13}/page-comments")
    public List<MyPageCommentResponse> getMyPageCommentsForBook(@PathVariable String isbn13,
                                                                Authentication authentication) {
        UserAccount me = getCurrentUser(authentication);

        return pageCommentRepository.findByUserAndIsbn13OrderByPageAsc(me, isbn13)
                .stream()
                .map(MyPageCommentResponse::from)
                .toList();
    }

    // 6) 코멘트 수정
    @PatchMapping("/page-comments/{id}")
    public void updateMyPageComment(@PathVariable Long id,
                                    @RequestBody MyPageCommentUpdateRequest req,
                                    Authentication authentication) {
        UserAccount me = getCurrentUser(authentication);

        PageComment c = pageCommentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (!c.getUser().getId().equals(me.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        c.setComment(req.comment());
        pageCommentRepository.save(c);
    }

    // 7) 코멘트 삭제
    @DeleteMapping("/page-comments/{id}")
    public void deleteMyPageComment(@PathVariable Long id,
                                    Authentication authentication) {
        UserAccount me = getCurrentUser(authentication);

        PageComment c = pageCommentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (!c.getUser().getId().equals(me.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        pageCommentRepository.delete(c);
    }

    // 8) 진행도 목록
    @GetMapping("/progress")
    public List<Map<String, Object>> getMyProgressBooks(Authentication authentication) {
        UserAccount me = getCurrentUser(authentication);

        return bookProgressRepository.findByUser(me).stream()
                .map(p -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("isbn13", p.getIsbn13());
                    m.put("currentPage", p.getCurrentPage());
                    return m;
                })
                .toList();
    }

}
