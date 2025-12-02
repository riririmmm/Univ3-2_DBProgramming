package com.example.demo.project.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookProgressRepository extends JpaRepository<BookProgress, String> {
}
