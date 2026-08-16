package com.lms.enrollmentservice.service;

import com.lms.enrollmentservice.dto.EnrollmentRequest;
import com.lms.enrollmentservice.dto.EnrollmentResponse;
import com.lms.enrollmentservice.dto.ProgressUpdateRequest;
import java.util.List;

public interface EnrollmentService {
    EnrollmentResponse createEnrollment(EnrollmentRequest request, Long studentId, String role);
    EnrollmentResponse getEnrollmentById(Long id, Long userId, String role);
    List<EnrollmentResponse> getEnrollmentsByStudent(Long studentId, Long authenticatedUserId, String role);
    List<EnrollmentResponse> getEnrollmentsByCourse(Long courseId, String role);
    EnrollmentResponse updateProgress(Long id, ProgressUpdateRequest request, Long userId, String role);
    EnrollmentResponse cancelEnrollment(Long id, Long userId, String role);
}
