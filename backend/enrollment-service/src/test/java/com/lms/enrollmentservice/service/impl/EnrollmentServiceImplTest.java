package com.lms.enrollmentservice.service.impl;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.security.access.AccessDeniedException;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;

import com.lms.enrollmentservice.client.CourseServiceClient;
import com.lms.enrollmentservice.client.UserServiceClient;

import com.lms.enrollmentservice.dto.CourseResponse;
import com.lms.enrollmentservice.dto.EnrollmentRequest;
import com.lms.enrollmentservice.dto.EnrollmentResponse;
import com.lms.enrollmentservice.dto.ProgressUpdateRequest;

import com.lms.enrollmentservice.entity.Enrollment;
import com.lms.enrollmentservice.entity.EnrollmentStatus;

import com.lms.enrollmentservice.exception.BadRequestException;
import com.lms.enrollmentservice.exception.ResourceNotFoundException;

import com.lms.enrollmentservice.repository.EnrollmentRepository;


@ExtendWith(MockitoExtension.class)
class EnrollmentServiceImplTest {

    @Mock
    private EnrollmentRepository enrollmentRepository;

    @Mock
    private UserServiceClient userServiceClient;

    @Mock
    private CourseServiceClient courseServiceClient;

    @InjectMocks
    private EnrollmentServiceImpl enrollmentService;


    // Validator for testing @Min, @Max and @NotNull
    private static Validator validator;
    private static ValidatorFactory validatorFactory;


    @BeforeAll
    static void setUpValidator() {

        validatorFactory =
                Validation.buildDefaultValidatorFactory();

        validator = validatorFactory.getValidator();
    }


    @AfterAll
    static void closeValidator() {

        validatorFactory.close();
    }


    // =========================================================
    // Test 1: Successful enrollment
    // =========================================================

    @Test
    void createEnrollment_ShouldCreateEnrollmentSuccessfully() {

        EnrollmentRequest request = mock(EnrollmentRequest.class);

        when(request.getCourseId()).thenReturn(10L);

        when(userServiceClient.existsById(1L))
                .thenReturn(true);

        CourseResponse course = mock(CourseResponse.class);

        when(course.getPublished()).thenReturn(true);

        when(courseServiceClient.getCourseById(10L))
                .thenReturn(course);

        when(enrollmentRepository
                .findByStudentIdAndCourseId(1L, 10L))
                .thenReturn(Optional.empty());

        Enrollment savedEnrollment =
                Enrollment.builder()
                        .id(1L)
                        .studentId(1L)
                        .courseId(10L)
                        .status(EnrollmentStatus.ACTIVE)
                        .progressPercentage(0.0)
                        .build();

        when(enrollmentRepository.save(any(Enrollment.class)))
                .thenReturn(savedEnrollment);

        EnrollmentResponse result =
                enrollmentService.createEnrollment(
                        request,
                        1L,
                        "STUDENT"
                );

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals(1L, result.getStudentId());
        assertEquals(10L, result.getCourseId());
        assertEquals("ACTIVE", result.getStatus());
        assertEquals(0.0, result.getProgressPercentage());

        verify(userServiceClient).existsById(1L);
        verify(courseServiceClient).getCourseById(10L);

        verify(enrollmentRepository)
                .findByStudentIdAndCourseId(1L, 10L);

        verify(enrollmentRepository)
                .save(any(Enrollment.class));
    }


    // =========================================================
    // Test 2: Non-student cannot enroll
    // =========================================================

    @Test
    void createEnrollment_WhenRoleIsNotStudent_ShouldThrowException() {

        EnrollmentRequest request =
                mock(EnrollmentRequest.class);

        assertThrows(
                AccessDeniedException.class,
                () -> enrollmentService.createEnrollment(
                        request,
                        1L,
                        "INSTRUCTOR"
                )
        );

        verify(userServiceClient, never())
                .existsById(any());

        verify(enrollmentRepository, never())
                .save(any(Enrollment.class));
    }


    // =========================================================
    // Test 3: Existing enrollment should be reactivated
    // =========================================================

    @Test
    void createEnrollment_WhenEnrollmentAlreadyExists_ShouldReactivateAndResetProgress() {

        Long studentId = 1L;
        Long courseId = 10L;

        EnrollmentRequest request =
                new EnrollmentRequest();

        request.setCourseId(courseId);

        // Student exists
        when(userServiceClient.existsById(studentId))
                .thenReturn(true);

        // Course exists and is published
        CourseResponse course =
                new CourseResponse();

        course.setId(courseId);
        course.setPublished(true);

        when(courseServiceClient.getCourseById(courseId))
                .thenReturn(course);

        // Existing enrollment
        Enrollment existingEnrollment =
                Enrollment.builder()
                        .id(100L)
                        .studentId(studentId)
                        .courseId(courseId)
                        .status(EnrollmentStatus.CANCELLED)
                        .progressPercentage(75.0)
                        .build();

        when(enrollmentRepository
                .findByStudentIdAndCourseId(
                        studentId,
                        courseId))
                .thenReturn(Optional.of(existingEnrollment));

        when(enrollmentRepository
                .save(existingEnrollment))
                .thenReturn(existingEnrollment);

        // Execute
        EnrollmentResponse response =
                enrollmentService.createEnrollment(
                        request,
                        studentId,
                        "STUDENT"
                );

        // Status should become ACTIVE
        assertEquals(
                EnrollmentStatus.ACTIVE.name(),
                response.getStatus()
        );

        // Progress should reset to 0
        assertEquals(
                0.0,
                response.getProgressPercentage()
        );

        // Existing enrollment should be saved
        verify(enrollmentRepository)
                .save(existingEnrollment);
    }


    // =========================================================
    // Test 4: Student does not exist
    // =========================================================

    @Test
    void createEnrollment_WhenStudentDoesNotExist_ShouldThrowException() {

        EnrollmentRequest request =
                mock(EnrollmentRequest.class);

        when(userServiceClient.existsById(99L))
                .thenReturn(false);

        assertThrows(
                ResourceNotFoundException.class,
                () -> enrollmentService.createEnrollment(
                        request,
                        99L,
                        "STUDENT"
                )
        );

        verify(userServiceClient)
                .existsById(99L);

        verify(courseServiceClient, never())
                .getCourseById(any());

        verify(enrollmentRepository, never())
                .save(any(Enrollment.class));
    }


    // =========================================================
    // Test 5: Course service unavailable
    // =========================================================

    @Test
    void createEnrollment_WhenCourseServiceFails_ShouldThrowException() {

        EnrollmentRequest request =
                mock(EnrollmentRequest.class);

        when(request.getCourseId())
                .thenReturn(10L);

        when(userServiceClient.existsById(1L))
                .thenReturn(true);

        when(courseServiceClient.getCourseById(10L))
                .thenThrow(new RuntimeException());

        assertThrows(
                BadRequestException.class,
                () -> enrollmentService.createEnrollment(
                        request,
                        1L,
                        "STUDENT"
                )
        );

        verify(courseServiceClient)
                .getCourseById(10L);

        verify(enrollmentRepository, never())
                .save(any(Enrollment.class));
    }


    // =========================================================
    // Test 6: Cannot enroll in unpublished course
    // =========================================================

    @Test
    void createEnrollment_WhenCourseIsUnpublished_ShouldThrowException() {

        EnrollmentRequest request =
                mock(EnrollmentRequest.class);

        when(request.getCourseId())
                .thenReturn(10L);

        when(userServiceClient.existsById(1L))
                .thenReturn(true);

        CourseResponse course =
                mock(CourseResponse.class);

        when(course.getPublished())
                .thenReturn(false);

        when(courseServiceClient.getCourseById(10L))
                .thenReturn(course);

        assertThrows(
                BadRequestException.class,
                () -> enrollmentService.createEnrollment(
                        request,
                        1L,
                        "STUDENT"
                )
        );

        verify(enrollmentRepository, never())
                .save(any(Enrollment.class));
    }


    // =========================================================
    // Test 7: Get enrollment by ID
    // =========================================================

    @Test
    void getEnrollmentById_ShouldReturnEnrollment() {

        Enrollment enrollment =
                Enrollment.builder()
                        .id(1L)
                        .studentId(1L)
                        .courseId(10L)
                        .status(EnrollmentStatus.ACTIVE)
                        .progressPercentage(50.0)
                        .build();

        when(enrollmentRepository.findById(1L))
                .thenReturn(Optional.of(enrollment));

        EnrollmentResponse result =
                enrollmentService.getEnrollmentById(
                        1L,
                        1L,
                        "STUDENT"
                );

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals(1L, result.getStudentId());
        assertEquals(10L, result.getCourseId());
        assertEquals(50.0, result.getProgressPercentage());

        verify(enrollmentRepository)
                .findById(1L);
    }


    // =========================================================
    // Test 8: Student cannot view another student's enrollment
    // =========================================================

    @Test
    void getEnrollmentById_WhenStudentIsNotOwner_ShouldThrowException() {

        Enrollment enrollment =
                Enrollment.builder()
                        .id(1L)
                        .studentId(20L)
                        .courseId(10L)
                        .status(EnrollmentStatus.ACTIVE)
                        .progressPercentage(20.0)
                        .build();

        when(enrollmentRepository.findById(1L))
                .thenReturn(Optional.of(enrollment));

        assertThrows(
                AccessDeniedException.class,
                () -> enrollmentService.getEnrollmentById(
                        1L,
                        1L,
                        "STUDENT"
                )
        );
    }


    // =========================================================
    // Test 9: Get enrollments by student
    // =========================================================

    @Test
    void getEnrollmentsByStudent_ShouldReturnEnrollments() {

        Enrollment enrollment =
                Enrollment.builder()
                        .id(1L)
                        .studentId(1L)
                        .courseId(10L)
                        .status(EnrollmentStatus.ACTIVE)
                        .progressPercentage(25.0)
                        .build();

        when(enrollmentRepository.findByStudentId(1L))
                .thenReturn(List.of(enrollment));

        List<EnrollmentResponse> result =
                enrollmentService.getEnrollmentsByStudent(
                        1L,
                        1L,
                        "STUDENT"
                );

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(
                1L,
                result.get(0).getStudentId()
        );

        verify(enrollmentRepository)
                .findByStudentId(1L);
    }


    // =========================================================
    // Test 10: Student cannot view all course enrollments
    // =========================================================

    @Test
    void getEnrollmentsByCourse_WhenRoleIsStudent_ShouldThrowException() {

        assertThrows(
                AccessDeniedException.class,
                () -> enrollmentService.getEnrollmentsByCourse(
                        10L,
                        "STUDENT"
                )
        );

        verify(enrollmentRepository, never())
                .findByCourseId(any());
    }


    // =========================================================
    // Test 11: Update progress successfully
    // =========================================================

    @Test
    void updateProgress_ShouldUpdateProgressSuccessfully() {

        ProgressUpdateRequest request =
                mock(ProgressUpdateRequest.class);

        when(request.getProgressPercentage())
                .thenReturn(75.0);

        Enrollment enrollment =
                Enrollment.builder()
                        .id(1L)
                        .studentId(1L)
                        .courseId(10L)
                        .status(EnrollmentStatus.ACTIVE)
                        .progressPercentage(20.0)
                        .build();

        when(enrollmentRepository.findById(1L))
                .thenReturn(Optional.of(enrollment));

        when(enrollmentRepository.save(enrollment))
                .thenReturn(enrollment);

        EnrollmentResponse result =
                enrollmentService.updateProgress(
                        1L,
                        request,
                        1L,
                        "STUDENT"
                );

        assertNotNull(result);

        assertEquals(
                75.0,
                result.getProgressPercentage()
        );

        verify(enrollmentRepository)
                .save(enrollment);
    }


    // =========================================================
    // Test 12: Progress reaches 100%
    // =========================================================

    @Test
    void updateProgress_WhenProgressIs100_ShouldCompleteEnrollment() {

        ProgressUpdateRequest request =
                mock(ProgressUpdateRequest.class);

        when(request.getProgressPercentage())
                .thenReturn(100.0);

        Enrollment enrollment =
                Enrollment.builder()
                        .id(1L)
                        .studentId(1L)
                        .courseId(10L)
                        .status(EnrollmentStatus.ACTIVE)
                        .progressPercentage(50.0)
                        .build();

        when(enrollmentRepository.findById(1L))
                .thenReturn(Optional.of(enrollment));

        when(enrollmentRepository.save(enrollment))
                .thenReturn(enrollment);

        EnrollmentResponse result =
                enrollmentService.updateProgress(
                        1L,
                        request,
                        1L,
                        "STUDENT"
                );

        assertEquals(
                100.0,
                result.getProgressPercentage()
        );

        assertEquals(
                "COMPLETED",
                result.getStatus()
        );

        verify(enrollmentRepository)
                .save(enrollment);
    }


    // =========================================================
    // Test 13: Cancel enrollment successfully
    // =========================================================

    @Test
    void cancelEnrollment_ShouldCancelEnrollmentSuccessfully() {

        Enrollment enrollment =
                Enrollment.builder()
                        .id(1L)
                        .studentId(1L)
                        .courseId(10L)
                        .status(EnrollmentStatus.ACTIVE)
                        .progressPercentage(40.0)
                        .build();

        when(enrollmentRepository.findById(1L))
                .thenReturn(Optional.of(enrollment));

        when(enrollmentRepository.save(enrollment))
                .thenReturn(enrollment);

        EnrollmentResponse result =
                enrollmentService.cancelEnrollment(
                        1L,
                        1L,
                        "STUDENT"
                );

        assertNotNull(result);

        assertEquals(
                "CANCELLED",
                result.getStatus()
        );

        verify(enrollmentRepository)
                .save(enrollment);
    }


    // =========================================================
    // Test 14: Already cancelled enrollment
    // =========================================================

    @Test
    void cancelEnrollment_WhenAlreadyCancelled_ShouldThrowException() {

        Enrollment enrollment =
                Enrollment.builder()
                        .id(1L)
                        .studentId(1L)
                        .courseId(10L)
                        .status(EnrollmentStatus.CANCELLED)
                        .progressPercentage(40.0)
                        .build();

        when(enrollmentRepository.findById(1L))
                .thenReturn(Optional.of(enrollment));

        assertThrows(
                BadRequestException.class,
                () -> enrollmentService.cancelEnrollment(
                        1L,
                        1L,
                        "STUDENT"
                )
        );

        verify(enrollmentRepository, never())
                .save(any(Enrollment.class));
    }


    // =========================================================
    // Test 15: Progress below 0%
    // =========================================================

    @Test
    void progressBelowZero_ShouldFailValidation() {

        ProgressUpdateRequest request =
                new ProgressUpdateRequest(-1.0);

        Set<ConstraintViolation<ProgressUpdateRequest>> violations =
                validator.validate(request);

        assertFalse(
                violations.isEmpty(),
                "Progress below 0 should fail validation"
        );
    }


    // =========================================================
    // Test 16: Progress exactly 0%
    // =========================================================

    @Test
    void progressAtZero_ShouldPassValidation() {

        ProgressUpdateRequest request =
                new ProgressUpdateRequest(0.0);

        Set<ConstraintViolation<ProgressUpdateRequest>> violations =
                validator.validate(request);

        assertTrue(
                violations.isEmpty(),
                "0% should be a valid progress value"
        );
    }


    // =========================================================
    // Test 17: Progress at 50%
    // =========================================================

    @Test
    void progressAt50_ShouldPassValidation() {

        ProgressUpdateRequest request =
                new ProgressUpdateRequest(50.0);

        Set<ConstraintViolation<ProgressUpdateRequest>> violations =
                validator.validate(request);

        assertTrue(
                violations.isEmpty(),
                "50% should be a valid progress value"
        );
    }


    // =========================================================
    // Test 18: Progress above 100%
    // =========================================================

    @Test
    void progressAbove100_ShouldFailValidation() {

        ProgressUpdateRequest request =
                new ProgressUpdateRequest(101.0);

        Set<ConstraintViolation<ProgressUpdateRequest>> violations =
                validator.validate(request);

        assertFalse(
                violations.isEmpty(),
                "Progress above 100 should fail validation"
        );
    }
}