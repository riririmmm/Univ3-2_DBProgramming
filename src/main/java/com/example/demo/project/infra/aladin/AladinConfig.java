package com.example.demo.project.infra.aladin;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class AladinConfig {
    @Bean
    public RestTemplate aladinRestTemplate() {
        return new RestTemplate();
    }
}
