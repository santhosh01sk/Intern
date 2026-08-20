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
public class TeacherAnalyticsInfo {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private List<String> courseTitles;
    private long totalStudents;
    private String specialization;
}
