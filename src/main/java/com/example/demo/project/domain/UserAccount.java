package com.example.demo.project.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class UserAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 로그인 아이디
    @Column(nullable = false, unique = true, length = 50)
    private String username;

    // 비밀번호(BCrypt)
    @Column(nullable = false)
    private String password;

    // 닉네임
    @Column(nullable = false, length = 30)
    private String nickname;

    // local 또는 google
    @Column(nullable = false, length = 20)
    private String provider;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    protected UserAccount() {}

    public UserAccount(String username, String password, String nickname, String provider) {
        this.username = username;
        this.password = password;
        this.nickname = nickname;
        this.provider = provider;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getPassword() { return password; }
    public String getNickname() { return nickname; }
    public String getProvider() { return provider; }
}
