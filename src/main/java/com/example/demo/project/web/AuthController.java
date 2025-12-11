package com.example.demo.project.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class AuthController {

    @GetMapping("/login")
    public String loginPage() {
        return "login";   // templates/login.html
    }

    @GetMapping("/signup")
    public String signupPage() {
        return "signup";  // templates/signup.html
    }
}
