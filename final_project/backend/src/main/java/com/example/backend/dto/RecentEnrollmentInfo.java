package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecentEnrollmentInfo {
    private String studentName;
    private String studentEmail;
    private String courseTitle;
    private Instant enrollmentDate;
}
