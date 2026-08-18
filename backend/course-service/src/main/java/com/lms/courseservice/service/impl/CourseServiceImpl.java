package com.lms.courseservice.service.impl;

import com.lms.courseservice.dto.CourseRequest;
import com.lms.courseservice.dto.CourseResponse;
import com.lms.courseservice.entity.Course;
import com.lms.courseservice.exception.BadRequestException;
import com.lms.courseservice.exception.ResourceNotFoundException;
import com.lms.courseservice.exception.UnauthorizedException;
import com.lms.courseservice.repository.CourseRepository;
import com.lms.courseservice.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseServiceImpl implements CourseService {

    private final CourseRepository courseRepository;

    @Override
    public CourseResponse createCourse(CourseRequest request, Long instructorId, String role) {
        if (!"INSTRUCTOR".equals(role) && !"ADMIN".equals(role)) {
            throw new AccessDeniedException("Only instructors and admins can create courses");
        }

        Course course = Course.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory())
                .instructorId(instructorId)
                .instructorName(request.getInstructorName())
                .price(request.getPrice())
                .duration(request.getDuration())
                .videoUrl(request.getVideoUrl())
                .notesUrl(request.getNotesUrl())
                .notesContent(request.getNotesContent())
                .notesJson(request.getNotesJson())
                .videosJson(request.getVideosJson())
                .tableOfContents(request.getTableOfContents())
                .quizJson(request.getQuizJson())
                .published(false)
                .build();

        Course savedCourse = courseRepository.save(course);
        return mapToResponse(savedCourse);
    }

    @Override
    public CourseResponse getCourseById(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + id));
        return mapToResponse(course);
    }

    @Override
    public List<CourseResponse> getAllCourses() {
        return courseRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<CourseResponse> getPublishedCourses() {
        return courseRepository.findByPublishedTrue().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<CourseResponse> getCoursesByInstructor(Long instructorId) {
        return courseRepository.findByInstructorId(instructorId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public CourseResponse updateCourse(Long id, CourseRequest request, Long userId, String role) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + id));

        validateCourseOwnership(course, userId, role);

        course.setTitle(request.getTitle());
        course.setDescription(request.getDescription());
        course.setCategory(request.getCategory());
        if (request.getInstructorName() != null && !request.getInstructorName().trim().isEmpty()) {
            course.setInstructorName(request.getInstructorName().trim());
        }
        course.setPrice(request.getPrice());
        course.setDuration(request.getDuration());
        course.setVideoUrl(request.getVideoUrl());
        course.setNotesUrl(request.getNotesUrl());
        course.setNotesContent(request.getNotesContent());
        course.setNotesJson(request.getNotesJson());
        course.setVideosJson(request.getVideosJson());
        course.setTableOfContents(request.getTableOfContents());
        course.setQuizJson(request.getQuizJson());

        Course updatedCourse = courseRepository.save(course);
        return mapToResponse(updatedCourse);
    }

    @Override
    public void deleteCourse(Long id, Long userId, String role) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + id));

        validateCourseOwnership(course, userId, role);

        courseRepository.delete(course);
    }

    @Override
    public CourseResponse publishCourse(Long id, Long userId, String role) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + id));

        validateCourseOwnership(course, userId, role);

        course.setPublished(true);
        Course updatedCourse = courseRepository.save(course);
        return mapToResponse(updatedCourse);
    }

    private void validateCourseOwnership(Course course, Long userId, String role) {
        if ("ADMIN".equals(role)) {
            return; // Admins can manage any course
        }
        if (!"INSTRUCTOR".equals(role)) {
            throw new AccessDeniedException("Only instructors and admins can modify courses");
        }
        if (!course.getInstructorId().equals(userId)) {
            throw new AccessDeniedException("You can only modify your own courses");
        }
    }

    private CourseResponse mapToResponse(Course course) {
        return CourseResponse.builder()
                .id(course.getId())
                .title(course.getTitle())
                .description(course.getDescription())
                .category(course.getCategory())
                .instructorId(course.getInstructorId())
                .instructorName(course.getInstructorName())
                .price(course.getPrice())
                .duration(course.getDuration())
                .published(course.getPublished())
                .videoUrl(course.getVideoUrl())
                .notesUrl(course.getNotesUrl())
                .notesContent(course.getNotesContent())
                .notesJson(course.getNotesJson())
                .videosJson(course.getVideosJson())
                .tableOfContents(course.getTableOfContents())
                .quizJson(course.getQuizJson())
                .createdAt(course.getCreatedAt())
                .updatedAt(course.getUpdatedAt())
                .build();
    }
}
