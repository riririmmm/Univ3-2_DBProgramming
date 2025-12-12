package com.example.demo.project.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PageCommentRepository extends JpaRepository<PageComment, Long> {

    List<PageComment> findByIsbn13OrderByPageAsc(String isbn13);

    List<PageComment> findByIsbn13AndPageLessThanEqualOrderByPageAsc(String isbn13, Integer page);

    List<PageComment> findByUserOrderByCreatedAtDesc(UserAccount user);

    List<PageComment> findByUserAndIsbn13OrderByPageAsc(UserAccount user, String isbn13);
}
