package com.lms.enrollmentservice.service.impl;

import com.lms.enrollmentservice.client.CourseServiceClient;
import com.lms.enrollmentservice.client.UserServiceClient;
import com.lms.enrollmentservice.dto.*;
import com.lms.enrollmentservice.entity.Enrollment;
import com.lms.enrollmentservice.entity.EnrollmentStatus;
import com.lms.enrollmentservice.exception.*;
import com.lms.enrollmentservice.repository.EnrollmentRepository;
import com.lms.enrollmentservice.service.EnrollmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EnrollmentServiceImpl implements EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final UserServiceClient userServiceClient;
    private final CourseServiceClient courseServiceClient;

    @Override
    public EnrollmentResponse createEnrollment(EnrollmentRequest request, Long studentId, String role) {
        // Only students can enroll
        if (!"STUDENT".equals(role)) {
            throw new AccessDeniedException("Only students can enroll in courses");
        }

        // Verify student exists via Feign
        try {
            Boolean exists = userServiceClient.existsById(studentId);
            if (exists == null || !exists) {
                throw new ResourceNotFoundException("Student not found with id: " + studentId);
            }
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new BadRequestException("Unable to verify student. User service may be unavailable.");
        }

        // Verify course exists and is published via Feign
        CourseResponse course;
        try {
            course = courseServiceClient.getCourseById(request.getCourseId());
        } catch (Exception e) {
            throw new BadRequestException("Unable to verify course. Course service may be unavailable.");
        }

        if (course == null) {
            throw new ResourceNotFoundException("Course not found with id: " + request.getCourseId());
        }

        if (!Boolean.TRUE.equals(course.getPublished())) {
            throw new BadRequestException("Cannot enroll in an unpublished course");
        }

        // Check for existing enrollment to reuse or prevent duplicates
        java.util.Optional<Enrollment> existingEnrollmentOpt = enrollmentRepository
                .findByStudentIdAndCourseId(studentId, request.getCourseId());

        Enrollment savedEnrollment;
        if (existingEnrollmentOpt.isPresent()) {
            Enrollment existingEnrollment = existingEnrollmentOpt.get();
            if (existingEnrollment.getStatus() == EnrollmentStatus.CANCELLED) {
                existingEnrollment.setStatus(EnrollmentStatus.ACTIVE);
                existingEnrollment.setProgressPercentage(0.0);
                savedEnrollment = enrollmentRepository.save(existingEnrollment);
            } else {
                throw new DuplicateResourceException("Student is already enrolled in this course");
            }
        } else {
            Enrollment enrollment = Enrollment.builder()
                    .studentId(studentId)
                    .courseId(request.getCourseId())
                    .status(EnrollmentStatus.ACTIVE)
                    .progressPercentage(0.0)
                    .build();
            savedEnrollment = enrollmentRepository.save(enrollment);
        }

        return mapToResponse(savedEnrollment);
    }

    @Override
    public EnrollmentResponse getEnrollmentById(Long id, Long userId, String role) {
        Enrollment enrollment = enrollmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment not found with id: " + id));

        // Students can only view their own enrollments
        if ("STUDENT".equals(role) && !enrollment.getStudentId().equals(userId)) {
            throw new AccessDeniedException("You can only view your own enrollments");
        }

        return mapToResponse(enrollment);
    }

    @Override
    public List<EnrollmentResponse> getEnrollmentsByStudent(Long studentId, Long authenticatedUserId, String role) {
        // Students can only view their own enrollments
        if ("STUDENT".equals(role) && !studentId.equals(authenticatedUserId)) {
            throw new AccessDeniedException("You can only view your own enrollments");
        }

        return enrollmentRepository.findByStudentId(studentId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<EnrollmentResponse> getEnrollmentsByCourse(Long courseId, String role) {
        if ("STUDENT".equals(role)) {
            throw new AccessDeniedException("Students cannot view all enrollments for a course");
        }

        return enrollmentRepository.findByCourseId(courseId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public EnrollmentResponse updateProgress(Long id, ProgressUpdateRequest request, Long userId, String role) {
        Enrollment enrollment = enrollmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment not found with id: " + id));

        // Only the enrolled student or admin can update progress
        if ("STUDENT".equals(role) && !enrollment.getStudentId().equals(userId)) {
            throw new AccessDeniedException("You can only update your own enrollment progress");
        }

        if (enrollment.getStatus() == EnrollmentStatus.CANCELLED) {
            throw new BadRequestException("Cannot update progress for a cancelled enrollment");
        }

        enrollment.setProgressPercentage(request.getProgressPercentage());

        if (request.getProgressPercentage() >= 100.0) {
            enrollment.setStatus(EnrollmentStatus.COMPLETED);
        }

        Enrollment updatedEnrollment = enrollmentRepository.save(enrollment);
        return mapToResponse(updatedEnrollment);
    }

    @Override
    public EnrollmentResponse cancelEnrollment(Long id, Long userId, String role) {
        Enrollment enrollment = enrollmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment not found with id: " + id));

        // Only the enrolled student or admin can cancel
        if ("STUDENT".equals(role) && !enrollment.getStudentId().equals(userId)) {
            throw new AccessDeniedException("You can only cancel your own enrollment");
        }

        if (enrollment.getStatus() == EnrollmentStatus.CANCELLED) {
            throw new BadRequestException("Enrollment is already cancelled");
        }

        enrollment.setStatus(EnrollmentStatus.CANCELLED);
        Enrollment updatedEnrollment = enrollmentRepository.save(enrollment);
        return mapToResponse(updatedEnrollment);
    }

    private EnrollmentResponse mapToResponse(Enrollment enrollment) {
        return EnrollmentResponse.builder()
                .id(enrollment.getId())
                .studentId(enrollment.getStudentId())
                .courseId(enrollment.getCourseId())
                .enrolledAt(enrollment.getEnrolledAt())
                .status(enrollment.getStatus().name())
                .progressPercentage(enrollment.getProgressPercentage())
                .build();
    }
}
