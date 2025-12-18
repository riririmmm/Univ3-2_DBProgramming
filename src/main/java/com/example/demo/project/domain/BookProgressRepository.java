package com.example.demo.project.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface BookProgressRepository extends JpaRepository<BookProgress, Long> {
    Optional<BookProgress> findByUserAndIsbn13(UserAccount user, String isbn13);
    List<BookProgress> findByUser(UserAccount user);

    @Transactional
    void deleteByUserAndIsbn13(UserAccount user, String isbn13);
}
