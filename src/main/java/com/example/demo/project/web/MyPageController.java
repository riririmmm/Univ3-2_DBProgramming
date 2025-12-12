package com.example.demo.project.web;

import com.example.demo.project.domain.UserAccount;
import com.example.demo.project.domain.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
@RequiredArgsConstructor
public class MyPageController {

    private final UserAccountRepository userAccountRepository;

    @GetMapping("/me")
    public String myPage(Authentication authentication, Model model) {
        String username = authentication.getName();     // 폼/구글 둘 다 이메일 기준
        UserAccount me = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("로그인 유저를 찾을 수 없습니다."));

        model.addAttribute("nickname", me.getNickname());

        return "user/my-page";   // templates/user/my-page.html
    }
}
