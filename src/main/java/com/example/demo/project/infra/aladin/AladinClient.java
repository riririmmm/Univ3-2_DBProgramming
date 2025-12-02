package com.example.demo.project.infra.aladin;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.nio.charset.StandardCharsets;

@Component
public class AladinClient {
    private final RestTemplate rest;
    private final String baseUrl;
    private final String ttbKey;
    private final ObjectMapper om = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    public AladinClient(RestTemplate rest,
                        @org.springframework.beans.factory.annotation.Value("${aladin.base-url}") String baseUrl,
                        @org.springframework.beans.factory.annotation.Value("${aladin.ttb-key}") String ttbKey) {
        this.rest = rest;
        this.baseUrl = baseUrl;
        this.ttbKey = ttbKey;
    }

    public AladinSearchResponse search(String query, int max) {
        String uri = UriComponentsBuilder.fromUriString(baseUrl)
                .pathSegment("ItemSearch.aspx")
                .queryParam("TTBKey", ttbKey)
                .queryParam("Query", query)
                .queryParam("QueryType", "Keyword")
                .queryParam("SearchTarget", "Book")
                .queryParam("MaxResults", Math.max(1, Math.min(max, 30)))
                .queryParam("Cover", "Big")
                .queryParam("Output", "js")
                .queryParam("Version", "20131101")
                .build()
                .toUriString();

        String body = rest.getForObject(uri, String.class);
        System.out.println("[ALADIN][SEARCH] " + uri);
        System.out.println("body: " + body);
        if (body == null || body.isBlank()) return null;
        if (body.contains("\"errorCode\"")) throw new RuntimeException("Aladin error: " + body);

        try {
            AladinSearchResponse res = om.readValue(body, AladinSearchResponse.class);

            System.out.println("[ALADIN][PARSED] totalResults = " + res.getTotalResults());
            System.out.println("[ALADIN][PARSED] items = " +
                    (res.getItem() == null ? "null" : res.getItem().size()));

            return res;
        } catch (Exception e) {
            throw new RuntimeException("Aladin JSON parse failed: " + e.getMessage());
        }
    }

    public AladinItem lookupByIsbn13(String isbn13) {
        String uri = UriComponentsBuilder.fromUriString(baseUrl)
                .pathSegment("ItemLookUp.aspx")
                .queryParam("TTBKey", ttbKey)
                .queryParam("ItemId", isbn13)
                .queryParam("itemIdType", "ISBN13")
                .queryParam("Cover", "Big")
                .queryParam("Output", "js")
                .queryParam("Version", "20131101")
                .build()
                .encode(StandardCharsets.UTF_8)
                .toUriString();

        String body = rest.getForObject(uri, String.class);
        System.out.println("[ALADIN][SEARCH] " + uri);
        System.out.println("body: " + body);
        if (body == null || body.isBlank()) throw new RuntimeException("empty body");
        if (body.contains("\"errorCode\"")) throw new RuntimeException("Aladin error: " + body);

        try {
            AladinSearchResponse res = om.readValue(body, AladinSearchResponse.class);
            if (res.getItem() == null || res.getItem().isEmpty())
                throw new RuntimeException("No item for isbn13=" + isbn13);
            return res.getItem().get(0);
        } catch (Exception e) {
            throw new RuntimeException("Aladin JSON parse failed: " + e.getMessage());
        }
    }
}
