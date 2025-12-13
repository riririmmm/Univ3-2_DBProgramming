package com.example.demo.project.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BookProgressRepository extends JpaRepository<BookProgress, Long> {
    Optional<BookProgress> findByUserAndIsbn13(UserAccount user, String isbn13);
}
