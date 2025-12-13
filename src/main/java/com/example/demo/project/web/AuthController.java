package com.example.demo.project.web;

import com.example.demo.project.api.dto.SignupForm;
import com.example.demo.project.domain.UserAccount;
import com.example.demo.project.domain.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.regex.Pattern;

@Controller
@RequiredArgsConstructor
public class AuthController {

    // 5자 이상 + 특수문자 1개 이상
    private static final Pattern PASSWORD_PATTERN = Pattern.compile(
            "^(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?]).{5,}$"
    );
    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/login")
    public String loginPage() {
        return "login";
    }

    @GetMapping("/signup")
    public String signupForm(Model model) {
        model.addAttribute("signupForm", new SignupForm());
        return "signup";
    }

    @PostMapping("/signup")
    public String doSignup(@ModelAttribute SignupForm signupForm, Model model) {

        // 비밀번호 정책 검증 (여기에 추가!)
        String rawPw = signupForm.getPassword();
        if (rawPw == null || !PASSWORD_PATTERN.matcher(rawPw).matches()) {
            model.addAttribute("signupForm", signupForm);
            model.addAttribute("errorMessage", "비밀번호는 5자 이상이며 특수문자를 1개 이상 포함해야 합니다.");
            return "signup";
        }

        if (userAccountRepository.existsByUsername(signupForm.getUsername())) {
            model.addAttribute("signupForm", signupForm);
            model.addAttribute("errorMessage", "이미 사용 중인 아이디입니다.");
            return "signup";
        }

        String encoded = passwordEncoder.encode(rawPw);

        UserAccount user = new UserAccount(
                signupForm.getUsername(),
                encoded,
                signupForm.getNickname(),
                "local"
        );

        userAccountRepository.save(user);

        return "redirect:/login";
    }
}
