package com.example.demo.project.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    // 특정 책(isbn13)의 모든 리뷰 가져오기
    List<Review> findByIsbn13(String isbn13);

    // 특정 책의 평균 평점 구하기 (rating IS NOT NULL 인 것만)
    @Query("select avg(r.rating) from Review r where r.isbn13 = :isbn13 and r.rating is not null")
    Double findAvgRatingByIsbn13(String isbn13);
}
