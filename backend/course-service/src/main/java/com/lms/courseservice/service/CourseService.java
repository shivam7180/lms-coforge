package com.lms.courseservice.service;

import com.lms.courseservice.dto.CourseRequest;
import com.lms.courseservice.dto.CourseResponse;
import java.util.List;

public interface CourseService {
    CourseResponse createCourse(CourseRequest request, Long instructorId, String role);
    CourseResponse getCourseById(Long id);
    List<CourseResponse> getAllCourses();
    List<CourseResponse> getPublishedCourses();
    List<CourseResponse> getCoursesByInstructor(Long instructorId);
    CourseResponse updateCourse(Long id, CourseRequest request, Long userId, String role);
    void deleteCourse(Long id, Long userId, String role);
    CourseResponse publishCourse(Long id, Long userId, String role);
}
