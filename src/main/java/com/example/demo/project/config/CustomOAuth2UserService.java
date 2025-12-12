package com.example.demo.project.config;

import com.example.demo.project.domain.UserAccount;
import com.example.demo.project.domain.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final UserAccountRepository userAccountRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        DefaultOAuth2UserService delegate = new DefaultOAuth2UserService();
        OAuth2User oAuth2User = delegate.loadUser(userRequest);

        Map<String, Object> attrs = new HashMap<>(oAuth2User.getAttributes());
        String email = (String) attrs.get("email");
        String name  = (String) attrs.getOrDefault("name", email);

        if (email == null) {
            throw new OAuth2AuthenticationException("Google 계정에 email 정보가 없습니다.");
        }

        // username = 구글 email 기준으로 사용자 조회
        UserAccount user = userAccountRepository.findByUsername(email)
                .orElseGet(() -> {
                    String dummyPassword = "oauth2user";        // 더미 비밀번호

                    UserAccount newUser = new UserAccount(
                            email,          // username
                            dummyPassword,  // password (안 씀)
                            name,           // nickname
                            "google"        // provider
                    );
                    return userAccountRepository.save(newUser);
                });

        // 템플릿에서 닉네임 쓰고 싶을 때 사용할 수 있음
        attrs.put("nickname", user.getNickname());

        return new DefaultOAuth2User(
                List.of(new SimpleGrantedAuthority("ROLE_USER")),
                attrs,
                "email"     // principal.getName() == email
        );
    }
}
