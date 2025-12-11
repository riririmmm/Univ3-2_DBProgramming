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

        // 아이디 존재 여부 체크
        boolean exists = userRepo.existsByUsername(username);

        if (!exists) {
            errorMsg = "존재하지 않는 계정입니다.";
        }
        // SpringSecurity에서 비밀번호 mismatch → BadCredentialsException
        else if (exception instanceof BadCredentialsException) {
            errorMsg = "비밀번호가 일치하지 않습니다.";
        }
        // 기타 오류
        else {
            errorMsg = "로그인에 실패했습니다.";
        }

        // 메시지를 login 페이지로 보내기
        response.sendRedirect("/login?error=" + errorMsg);
    }
}
