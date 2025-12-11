package com.example.demo.project.config;

import com.example.demo.project.domain.UserAccountRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
public class CustomAuthFailureHandler implements AuthenticationFailureHandler {

    private final UserAccountRepository userRepo;

    @Override
    public void onAuthenticationFailure(HttpServletRequest request,
                                        HttpServletResponse response,
                                        AuthenticationException exception)
            throws IOException, ServletException {

        String username = request.getParameter("username");
        String errorMsg;

        // 1) 아이디가 DB에 없는 경우
        boolean exists = userRepo.existsByUsername(username);

        if (!exists) {
            errorMsg = "존재하지 않는 계정입니다.";
        }
        // 2) 아이디는 있는데 비밀번호 틀린 경우
        else if (exception instanceof BadCredentialsException) {
            errorMsg = "비밀번호가 일치하지 않습니다.";
        }
        // 기타 오류
        else {
            errorMsg = "로그인에 실패했습니다.";
        }

        // 한글 / 공백 때문에 redirect 헤더 깨지지 않게 인코딩
        String encoded = URLEncoder.encode(errorMsg, StandardCharsets.UTF_8);

        response.sendRedirect("/login?error=" + encoded);
    }
}
