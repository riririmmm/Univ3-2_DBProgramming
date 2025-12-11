package com.example.demo.project.web;

import com.example.demo.project.api.dto.SignupForm;
import com.example.demo.project.domain.UserAccount;
import com.example.demo.project.domain.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequiredArgsConstructor
public class AuthController {

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

        if (userAccountRepository.existsByUsername(signupForm.getUsername())) {
            model.addAttribute("signupForm", signupForm);
            model.addAttribute("errorMessage", "이미 사용 중인 아이디입니다.");
            return "signup";
        }

        String encoded = passwordEncoder.encode(signupForm.getPassword());

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
