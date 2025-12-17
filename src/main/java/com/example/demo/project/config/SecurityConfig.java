package com.example.demo.project.config;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;

@RequiredArgsConstructor
@Configuration
public class SecurityConfig {

    private final CustomAuthFailureHandler customAuthFailureHandler;
    private final CustomOAuth2UserService customOAuth2UserService;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/", "/login", "/signup",
                                "/css/**", "/js/**", "/images/**",
                                "/oauth2/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/books/**").permitAll()       // 페이지(HTML) 상세보기 공개
                        .requestMatchers(HttpMethod.GET, "/api/books/**").permitAll()   // API 조회(검색/상세 조회) 공개

                        // API 쓰기(리뷰/코멘트/진행도 저장 등) 로그인 필요
                        .requestMatchers(HttpMethod.POST, "/api/**").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/api/**").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/**").authenticated()

                        .anyRequest().authenticated()
                )

                .exceptionHandling(e -> e
                        .defaultAuthenticationEntryPointFor(
                                (req, res, ex) -> res.sendError(HttpServletResponse.SC_UNAUTHORIZED),
                                PathPatternRequestMatcher.withDefaults().matcher("/api/**")
                        )
                        .authenticationEntryPoint(new LoginUrlAuthenticationEntryPoint("/login"))
                )

                .formLogin(form -> form
                        .loginPage("/login")
                        .defaultSuccessUrl("/", false) // true로 하면 항상 / 로 가서 원래 페이지 복귀가 깨짐
                        .failureHandler(customAuthFailureHandler)
                        .permitAll()
                )
                .oauth2Login(oauth -> oauth
                        .loginPage("/login")    // 폼로그인과 동일 페이지 사용
                        .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                        .defaultSuccessUrl("/", false)
                )
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessUrl("/")
                );

        return http.build();
    }
}
