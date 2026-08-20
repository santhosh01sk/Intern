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
public class AdminAnalyticsResponse {
    private long totalStudents;
    private long totalTeachers;
    private long totalCourses;
    private long totalEnrollments;
    private List<RecentEnrollmentInfo> recentEnrollments;
    private List<CourseEnrollmentStat> enrollmentsPerCourse;
    private List<TeacherCourseStat> coursesPerTeacher;
    private List<CategoryStat> popularCategories;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CourseEnrollmentStat {
        private String courseTitle;
        private long enrollmentCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TeacherCourseStat {
        private String teacherName;
        private long courseCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryStat {
        private String category;
        private long courseCount;
    }
}
