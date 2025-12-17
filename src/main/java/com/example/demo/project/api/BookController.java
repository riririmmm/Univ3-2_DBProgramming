package com.example.demo.project.api;

import com.example.demo.project.api.dto.BookView;
import com.example.demo.project.api.dto.NewPageComment;
import com.example.demo.project.api.dto.NewReview;
import com.example.demo.project.api.dto.ProgressReq;
import com.example.demo.project.domain.*;
import com.example.demo.project.infra.aladin.AladinClient;
import com.example.demo.project.infra.aladin.AladinItem;
import com.example.demo.project.infra.aladin.AladinSearchResponse;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
public class BookController {

    private final AladinClient aladin;
    private final BookProgressRepository progressRepo;
    private final PageCommentRepository pageCommentRepo;
    private final ReviewRepository reviewRepo;
    private final UserAccountRepository userAccountRepo;

    public BookController(AladinClient aladin,
                          BookProgressRepository progressRepo,
                          PageCommentRepository pageCommentRepo,
                          ReviewRepository reviewRepo,
                          UserAccountRepository userAccountRepo) {
        this.aladin = aladin;
        this.progressRepo = progressRepo;
        this.pageCommentRepo = pageCommentRepo;
        this.reviewRepo = reviewRepo;
        this.userAccountRepo = userAccountRepo;
    }

    // 현재 로그인한 UserAccount 가져오는 헬퍼
    private UserAccount getCurrentUser(Authentication authentication) {
        String username = authentication.getName();     // 폼/구글 둘 다 여기로 들어옴
        return userAccountRepo.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("로그인 유저를 찾을 수 없습니다: " + username));
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
                                              @RequestBody ProgressReq req,
                                              Authentication authentication) {
        if (req == null || req.getCurrentPage() == null || req.getCurrentPage() < 0) {
            throw new IllegalArgumentException("currentPage must be >= 0");
        }

        UserAccount me = getCurrentUser(authentication);

        BookProgress progress = progressRepo.findByUserAndIsbn13(me, isbn13)
                .orElseGet(() -> new BookProgress(me, isbn13, 0));

        progress.setCurrentPage(req.getCurrentPage());
        progressRepo.save(progress);

        return Map.of("isbn13", isbn13, "currentPage", progress.getCurrentPage());
    }

    @GetMapping("/api/books/{isbn13}/progress")
    public Map<String, Object> getProgress(@PathVariable String isbn13,
                                           Authentication authentication) {

        boolean loggedIn = authentication != null
                && authentication.isAuthenticated()
                && !"anonymousUser".equals(authentication.getName());

        if (!loggedIn) {
            return Map.of("isbn13", isbn13, "currentPage", 0);
        }

        UserAccount me = getCurrentUser(authentication);

        int current = progressRepo.findByUserAndIsbn13(me, isbn13)
                .map(BookProgress::getCurrentPage)
                .orElse(0);

        return Map.of("isbn13", isbn13, "currentPage", current);
    }

    // 페이지 코멘트 (PageComment 엔티티 사용)
    @PostMapping("/api/books/{isbn13}/page-comments")
    @ResponseStatus(HttpStatus.CREATED)
    public void addPageComment(@PathVariable String isbn13,
                               @RequestBody NewPageComment body,
                               Authentication authentication) {
        // 0페이지 허용
        if (body == null || body.getPage() == null || body.getPage() < 0
                || body.getComment() == null || body.getComment().isBlank()) {
            throw new IllegalArgumentException("page >= 0 and comment required");
        }

        // 로그인 유저 가져오기
        UserAccount me = getCurrentUser(authentication);

        // 유저까지 포함해서 저장
        PageComment entity = new PageComment(
                isbn13,
                body.getPage(),
                body.getComment(),
                me
        );

        pageCommentRepo.save(entity);
    }

    /**
     * 페이지 코멘트 조회
     *  - 기본값: 사용자가 저장한 진행도(currentPage)까지만
     *  - ?upto=300 같은 쿼리 파라미터로 범위 지정 가능 (1 ~ upto)
     */
    @GetMapping("/api/books/{isbn13}/page-comments")
    public Map<String, Object> listPageComments(@PathVariable String isbn13,
                                                @RequestParam(name = "upto", required = false) Integer upto,
                                                Authentication authentication) {

        boolean loggedIn = authentication != null
                && authentication.isAuthenticated()
                && !"anonymousUser".equals(authentication.getName());

        // 1) effectiveUpto 결정
        Integer effectiveUpto = upto;

        // upto가 없을 때만 "진행도"를 참고하고, 로그아웃이면 기본값 0 (필터 입력해서 upto 주면 그때부터 정상 동작)
        if (effectiveUpto == null) {
            if (loggedIn) {
                UserAccount me = getCurrentUser(authentication);
                effectiveUpto = progressRepo.findByUserAndIsbn13(me, isbn13)
                        .map(BookProgress::getCurrentPage)
                        .orElse(0);
            } else {
                effectiveUpto = 0;
            }
        }

        // 2) 조회 (0~effectiveUpto)
        List<PageComment> list = pageCommentRepo
                .findByIsbn13AndPageLessThanEqualOrderByPageAsc(isbn13, effectiveUpto);

        // 3) Map 변환
        List<Map<String, Object>> out = new ArrayList<>();
        for (PageComment c : list) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", c.getId());
            m.put("page", c.getPage());
            m.put("comment", c.getComment());
            m.put("authorNickname", c.getUser() != null ? c.getUser().getNickname() : null);
            out.add(m);
        }

        // 4) 현재 필터링 범위도 같이 내려줌
        return Map.of(
                "upto", effectiveUpto,
                "items", out
        );
    }

    // ---------------------------------------------------
    // 총평 / 리뷰 (Review 엔티티 사용, 여러 개 저장 + 평균 별점)
    // ---------------------------------------------------
    @PostMapping("/api/books/{isbn13}/review")
    @ResponseStatus(HttpStatus.CREATED)
    public void saveReview(@PathVariable String isbn13,
                           @RequestBody NewReview body,
                           Authentication authentication) {
        if (body == null || body.getOverall() == null || body.getOverall().isBlank()) {
            throw new IllegalArgumentException("overall required");
        }

        // rating 필드는 NewReview DTO에 Integer rating 추가해서 사용 (없으면 null 허용)
        Double rating = body.getRating();
        if (rating != null && (rating < 1 || rating > 5)) {
            throw new IllegalArgumentException("rating must be between 1 and 5");
        }

        boolean spoiler = Boolean.TRUE.equals(body.getSpoiler());

        // 로그인한 유저 엔티티 조회
        UserAccount user = getCurrentUser(authentication);

        // UserAccount 붙여서 Review 생성
        Review review = new Review(
                user,
                isbn13,
                rating,
                body.getOverall(),
                spoiler
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
        Double avg = reviewRepo.findAvgRatingByIsbn13(isbn13);

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
