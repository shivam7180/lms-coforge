package com.lms.enrollmentservice.controller;

import com.lms.enrollmentservice.dto.EnrollmentRequest;
import com.lms.enrollmentservice.dto.EnrollmentResponse;
import com.lms.enrollmentservice.dto.ProgressUpdateRequest;
import com.lms.enrollmentservice.service.EnrollmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    @PostMapping
    public ResponseEntity<EnrollmentResponse> createEnrollment(
            @Valid @RequestBody EnrollmentRequest request,
            Authentication authentication) {
        Long userId = (Long) authentication.getCredentials();
        String role = authentication.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
        return new ResponseEntity<>(enrollmentService.createEnrollment(request, userId, role), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EnrollmentResponse> getEnrollmentById(
            @PathVariable Long id,
            Authentication authentication) {
        Long userId = (Long) authentication.getCredentials();
        String role = authentication.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
        return ResponseEntity.ok(enrollmentService.getEnrollmentById(id, userId, role));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<EnrollmentResponse>> getEnrollmentsByStudent(
            @PathVariable Long studentId,
            Authentication authentication) {
        Long userId = (Long) authentication.getCredentials();
        String role = authentication.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
        return ResponseEntity.ok(enrollmentService.getEnrollmentsByStudent(studentId, userId, role));
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<EnrollmentResponse>> getEnrollmentsByCourse(
            @PathVariable Long courseId,
            Authentication authentication) {
        String role = authentication.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
        return ResponseEntity.ok(enrollmentService.getEnrollmentsByCourse(courseId, role));
    }

    @PutMapping("/{id}/progress")
    public ResponseEntity<EnrollmentResponse> updateProgress(
            @PathVariable Long id,
            @Valid @RequestBody ProgressUpdateRequest request,
            Authentication authentication) {
        Long userId = (Long) authentication.getCredentials();
        String role = authentication.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
        return ResponseEntity.ok(enrollmentService.updateProgress(id, request, userId, role));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<EnrollmentResponse> cancelEnrollment(
            @PathVariable Long id,
            Authentication authentication) {
        Long userId = (Long) authentication.getCredentials();
        String role = authentication.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
        return ResponseEntity.ok(enrollmentService.cancelEnrollment(id, userId, role));
    }
}
