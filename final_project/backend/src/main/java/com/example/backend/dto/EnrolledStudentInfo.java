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
public class EnrolledStudentInfo {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private Instant enrollmentDate;
}
