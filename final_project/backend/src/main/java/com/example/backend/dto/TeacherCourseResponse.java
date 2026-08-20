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
public class TeacherCourseResponse {
    private Long id;
    private String title;
    private String description;
    private String category;
    private Integer duration;
    private long enrolledCount;
    private List<EnrolledStudentInfo> enrolledStudents;
}
