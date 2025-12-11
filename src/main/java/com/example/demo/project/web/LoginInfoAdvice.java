package com.example.demo.project.web;

import com.example.demo.project.domain.UserAccount;
import com.example.demo.project.domain.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

@ControllerAdvice
@RequiredArgsConstructor
public class LoginInfoAdvice {

    private final UserAccountRepository userAccountRepository;

    @ModelAttribute("loginNickname")
    public String loginNickname(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }

        Object principal = authentication.getPrincipal();

        // ① 아이디/비번(local) 로그인
        if (principal instanceof UserDetails userDetails) {
            return userAccountRepository.findByUsername(userDetails.getUsername())
                    .map(UserAccount::getNickname)
                    .orElse(userDetails.getUsername()); // 혹시 없으면 아이디라도
        }

        // ② 구글 로그인
        if (principal instanceof OAuth2User oAuth2User) {
            Object nameAttr = oAuth2User.getAttributes().get("name");
            if (nameAttr != null) return nameAttr.toString();

            Object emailAttr = oAuth2User.getAttributes().get("email");
            if (emailAttr != null) return emailAttr.toString();
        }

        // 그 외엔 기본 이름
        return authentication.getName();
    }
}
