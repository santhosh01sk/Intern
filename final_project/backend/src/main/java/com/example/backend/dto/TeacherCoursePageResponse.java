package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherCoursePageResponse {
    private List<TeacherCourseResponse> courses;
    private int currentPage;
    private int totalPages;
    private long totalElements;
    private List<String> categories;
}
