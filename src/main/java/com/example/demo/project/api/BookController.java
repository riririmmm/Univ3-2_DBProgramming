package com.example.demo.project.api;

import com.example.demo.project.api.dto.BookView;
import com.example.demo.project.api.dto.NewPageComment;
import com.example.demo.project.api.dto.NewReview;
import com.example.demo.project.api.dto.ProgressReq;
import com.example.demo.project.infra.aladin.AladinClient;
import com.example.demo.project.infra.aladin.AladinItem;
import com.example.demo.project.infra.aladin.AladinSearchResponse;

import com.example.demo.project.domain.BookProgress;
import com.example.demo.project.domain.PageComment;
import com.example.demo.project.domain.Review;
import com.example.demo.project.domain.BookProgressRepository;
import com.example.demo.project.domain.PageCommentRepository;
import com.example.demo.project.domain.ReviewRepository;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
public class BookController {

    private final AladinClient aladin;
    private final BookProgressRepository progressRepo;
    private final PageCommentRepository pageCommentRepo;
    private final ReviewRepository reviewRepo;

    public BookController(AladinClient aladin,
                          BookProgressRepository progressRepo,
                          PageCommentRepository pageCommentRepo,
                          ReviewRepository reviewRepo) {
        this.aladin = aladin;
        this.progressRepo = progressRepo;
        this.pageCommentRepo = pageCommentRepo;
        this.reviewRepo = reviewRepo;
    }

    // 검색
    @GetMapping("/api/books/search")
    public List<BookView> search(
            @RequestParam(name = "q") String q,
            @RequestParam(name = "size", defaultValue = "10") int size) {

        if (q == null || q.isBlank()) {
            throw new IllegalArgumentException("q (검색어) is required");
        }
        size = Math.max(1, Math.min(size, 30));

        AladinSearchResponse res = aladin.search(q.trim(), size);
        if (res == null || res.getItem() == null) return Collections.emptyList();

        return res.getItem().stream()
                .map(it -> new BookView(
                        it.getIsbn13(),
                        nz(it.getTitle()),
                        splitAuthors(it.getAuthor()),
                        nz(it.getPublisher()),
                        null,                 // 목록에서는 페이지수 비움
                        it.getCover(),
                        it.getDescription()
                ))
                .toList();
    }

    // 상세
    @GetMapping("/api/books/{isbn13}")
    public BookView detail(@PathVariable String isbn13) {
        AladinItem it = aladin.lookupByIsbn13(isbn13);
        return new BookView(
                it.getIsbn13(),
                nz(it.getTitle()),
                splitAuthors(it.getAuthor()),
                nz(it.getPublisher()),
                it.getResolvedPageCount(),
                it.getCover(),
                it.getDescription()
        );
    }

    // 진행도 (BookProgress 엔티티 사용)
    @PutMapping("/api/books/{isbn13}/progress")
    public Map<String, Object> updateProgress(@PathVariable String isbn13,
                                              @RequestBody ProgressReq req) {
        if (req == null || req.getCurrentPage() == null || req.getCurrentPage() < 0) {
            throw new IllegalArgumentException("currentPage must be >= 0");
        }

        BookProgress progress = new BookProgress(isbn13, req.getCurrentPage());
        progressRepo.save(progress);

        Map<String, Object> res = new HashMap<>();
        res.put("isbn13", isbn13);
        res.put("currentPage", req.getCurrentPage());
        return res;
    }

    @GetMapping("/api/books/{isbn13}/progress")
    public Map<String, Object> getProgress(@PathVariable String isbn13) {
        BookProgress progress = progressRepo.findById(isbn13).orElse(null);
        int current = (progress != null && progress.getCurrentPage() != null)
                ? progress.getCurrentPage() : 0;

        Map<String, Object> res = new HashMap<>();
        res.put("isbn13", isbn13);
        res.put("currentPage", current);
        return res;
    }

    // 페이지 코멘트 (PageComment 엔티티 사용)
    @PostMapping("/api/books/{isbn13}/page-comments")
    @ResponseStatus(HttpStatus.CREATED)
    public void addPageComment(@PathVariable String isbn13,
                               @RequestBody NewPageComment body) {
        if (body == null || body.getPage() == null || body.getPage() < 1
                || body.getComment() == null || body.getComment().isBlank()) {
            throw new IllegalArgumentException("page >= 1 and comment required");
        }

        PageComment entity = new PageComment(isbn13, body.getPage(), body.getComment());
        pageCommentRepo.save(entity);
    }

    /**
     * 페이지 코멘트 조회
     *  - 기본값: 사용자가 저장한 진행도(currentPage)까지만
     *  - ?upto=300 같은 쿼리 파라미터로 범위 지정 가능 (1 ~ upto)
     */
    @GetMapping("/api/books/{isbn13}/page-comments")
    public List<Map<String, Object>> listPageComments(@PathVariable String isbn13,
                                                      @RequestParam(name = "upto", required = false) Integer upto) {

        // 1) 기본 범위: 진행도(currentPage)
        Integer effectiveUpto = upto;
        if (effectiveUpto == null) {
            BookProgress progress = progressRepo.findById(isbn13).orElse(null);
            if (progress != null && progress.getCurrentPage() != null) {
                effectiveUpto = progress.getCurrentPage();
            }
        }

        // 2) 범위에 따라 쿼리
        List<PageComment> list;
        if (effectiveUpto != null) {
            list = pageCommentRepo
                    .findByIsbn13AndPageLessThanEqualOrderByPageAsc(isbn13, effectiveUpto);
        } else {
            list = pageCommentRepo
                    .findByIsbn13OrderByPageAsc(isbn13);
        }

        // 3) 간단한 Map 리스트로 변환
        List<Map<String, Object>> out = new ArrayList<>();
        for (PageComment c : list) {
            Map<String, Object> m = new HashMap<>();
            m.put("page", c.getPage());
            m.put("comment", c.getComment());
            out.add(m);
        }
        return out;
    }

    // ---------------------------------------------------
    // 총평 / 리뷰 (Review 엔티티 사용, 여러 개 저장 + 평균 별점)
    // ---------------------------------------------------
    @PostMapping("/api/books/{isbn13}/review")
    @ResponseStatus(HttpStatus.CREATED)
    public void saveReview(@PathVariable String isbn13, @RequestBody NewReview body) {
        if (body == null || body.getOverall() == null || body.getOverall().isBlank()) {
            throw new IllegalArgumentException("overall required");
        }

        // rating 필드는 NewReview DTO에 Integer rating 추가해서 사용 (없으면 null 허용)
        Integer rating = body.getRating();
        if (rating != null && (rating < 1 || rating > 5)) {
            throw new IllegalArgumentException("rating must be between 1 and 5");
        }

        boolean spoiler = Boolean.TRUE.equals(body.getSpoiler());

        Review review = new Review(
                isbn13,
                rating,
                spoiler,
                body.getOverall()
        );
        reviewRepo.save(review);
    }

    /**
     * 리뷰 조회
     *  - latest 텍스트 (스포일러면 가리기)
     *  - 평균 별점(avgRating) + 개수(count) 같이 반환
     */
    @GetMapping("/api/books/{isbn13}/review")
    public Map<String, Object> getReview(@PathVariable String isbn13,
                                         @RequestParam(defaultValue = "false") boolean reveal) {

        List<Review> reviews = reviewRepo.findByIsbn13(isbn13);
        Map<String, Object> res = new HashMap<>();

        if (reviews.isEmpty()) {
            // 아무 리뷰도 없으면 빈 맵 (프론트에서 "등록된 리뷰 없음" 처리)
            return res;
        }

        // 평균 별점 (rating IS NOT NULL 인 것만)
        Double avg = reviewRepo.findAvgRating(isbn13);

        reviews.sort(Comparator.comparingLong(Review::getId));
        Review latest = reviews.get(reviews.size() - 1);

        boolean spoiler = Boolean.TRUE.equals(latest.getSpoiler());
        String text = (spoiler && !reveal) ? "(스포일러로 가려짐)" : latest.getOverall();

        res.put("overall", text);
        res.put("spoiler", spoiler);
        res.put("avgRating", avg);           // 프론트에서 평균 별점 표시용
        res.put("count", reviews.size());    // 총 리뷰 개수

        return res;
    }

    // 유틸
    private static String nz(String s) {
        return (s == null) ? "" : s;
    }

    private static List<String> splitAuthors(String authorField) {
        if (authorField == null || authorField.isBlank()) return List.of();
        return Arrays.asList(authorField.split("\\s*,\\s*"));
    }
}
