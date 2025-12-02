package com.example.demo.project.infra.aladin;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class AladinSearchResponse {

    @JsonProperty("item")              // 키를 확실히 바인딩
    private List<AladinItem> item;

    @JsonProperty("totalResults")
    private int totalResults;   // ← 디버깅용으로만 쓸 수 있는 필드

    public int getTotalResults() {
        return totalResults;
    }

    public List<AladinItem> getItem() {
        return item;
    }

    public void setTotalResults(int totalResults) {
        this.totalResults = totalResults;
    }

    public void setItem(List<AladinItem> item) {
        this.item = item;
    }
}
