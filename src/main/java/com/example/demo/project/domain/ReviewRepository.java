package com.example.demo.project.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByIsbn13OrderByIdDesc(String isbn13);

    long countByIsbn13(String isbn13);

    @Query("select avg(r.rating) from Review r where r.isbn13 = :isbn13")
    Double findAverageRatingByIsbn13(String isbn13);
}
