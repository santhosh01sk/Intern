package com.example.backend.dto;

import lombok.Data;

@Data
public class CourseUpdateRequest {
    private String title;
    private String description;
    private String category;
    private Integer duration;
}
