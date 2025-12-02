package com.example.demo.project.web;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@Controller
public class BookPageController {

    // 메인 화면: 검색 페이지
    @GetMapping("/")
    public String index() {
        return "search";   // templates/search.html
    }

    // 도서 상세 화면
    @GetMapping("/books/{isbn13}")
    public String bookDetail(@PathVariable String isbn13, Model model) {
        model.addAttribute("isbn13", isbn13);
        return "book-detail";   // templates/book-detail.html
    }
}
