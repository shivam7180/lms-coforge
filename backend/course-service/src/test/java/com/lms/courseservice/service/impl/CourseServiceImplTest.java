package com.lms.courseservice.service.impl;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import com.lms.courseservice.dto.CourseRequest;
import com.lms.courseservice.dto.CourseResponse;
import com.lms.courseservice.entity.Course;
import com.lms.courseservice.exception.ResourceNotFoundException;
import com.lms.courseservice.repository.CourseRepository;

@ExtendWith(MockitoExtension.class)
class CourseServiceImplTest {

    @Mock
    private CourseRepository courseRepository;

    @InjectMocks
    private CourseServiceImpl courseService;


    @Test
    void createCourse_ShouldCreateCourseSuccessfully() {

        CourseRequest request = mock(CourseRequest.class);

        when(request.getTitle()).thenReturn("Java Programming");
        when(request.getDescription()).thenReturn("Learn Java");
        when(request.getCategory()).thenReturn("Programming");
        when(request.getInstructorName()).thenReturn("Shivam");

        Course savedCourse = mock(Course.class);

        when(savedCourse.getId()).thenReturn(1L);
        when(savedCourse.getTitle()).thenReturn("Java Programming");
        when(savedCourse.getDescription()).thenReturn("Learn Java");
        when(savedCourse.getCategory()).thenReturn("Programming");
        when(savedCourse.getInstructorId()).thenReturn(10L);
        when(savedCourse.getInstructorName()).thenReturn("Shivam");

        when(courseRepository.save(any(Course.class)))
                .thenReturn(savedCourse);

        CourseResponse result =
                courseService.createCourse(request, 10L, "INSTRUCTOR");

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Java Programming", result.getTitle());
        assertEquals("Programming", result.getCategory());

        verify(courseRepository).save(any(Course.class));
    }


    @Test
    void createCourse_WhenRoleIsStudent_ShouldThrowException() {

        CourseRequest request = mock(CourseRequest.class);

        assertThrows(
                AccessDeniedException.class,
                () -> courseService.createCourse(
                        request,
                        10L,
                        "STUDENT"
                )
        );

        verify(courseRepository, never()).save(any(Course.class));
    }


    @Test
    void getCourseById_ShouldReturnCourse() {

        Course course = mock(Course.class);

        when(course.getId()).thenReturn(1L);
        when(course.getTitle()).thenReturn("Java Programming");
        when(course.getDescription()).thenReturn("Learn Java");
        when(course.getCategory()).thenReturn("Programming");
        when(course.getInstructorId()).thenReturn(10L);
        when(course.getInstructorName()).thenReturn("Shivam");

        when(courseRepository.findById(1L))
                .thenReturn(Optional.of(course));

        CourseResponse result =
                courseService.getCourseById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Java Programming", result.getTitle());

        verify(courseRepository).findById(1L);
    }


    @Test
    void getCourseById_WhenCourseNotFound_ShouldThrowException() {

        when(courseRepository.findById(99L))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> courseService.getCourseById(99L)
        );

        verify(courseRepository).findById(99L);
    }


    @Test
    void getAllCourses_ShouldReturnCourses() {

        Course course1 = mock(Course.class);
        Course course2 = mock(Course.class);

        when(course1.getId()).thenReturn(1L);
        when(course1.getTitle()).thenReturn("Java");

        when(course2.getId()).thenReturn(2L);
        when(course2.getTitle()).thenReturn("Spring Boot");

        when(courseRepository.findAll())
                .thenReturn(List.of(course1, course2));

        List<CourseResponse> result =
                courseService.getAllCourses();

        assertNotNull(result);
        assertEquals(2, result.size());

        verify(courseRepository).findAll();
    }


    @Test
    void getPublishedCourses_ShouldReturnPublishedCourses() {

        Course course = mock(Course.class);

        when(course.getId()).thenReturn(1L);
        when(course.getTitle()).thenReturn("Java Programming");

        when(courseRepository.findByPublishedTrue())
                .thenReturn(List.of(course));

        List<CourseResponse> result =
                courseService.getPublishedCourses();

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(
                "Java Programming",
                result.get(0).getTitle()
        );

        verify(courseRepository).findByPublishedTrue();
    }


    @Test
    void getCoursesByInstructor_ShouldReturnInstructorCourses() {

        Course course = mock(Course.class);

        when(course.getId()).thenReturn(1L);
        when(course.getTitle()).thenReturn("Java Programming");
        when(course.getInstructorId()).thenReturn(10L);

        when(courseRepository.findByInstructorId(10L))
                .thenReturn(List.of(course));

        List<CourseResponse> result =
                courseService.getCoursesByInstructor(10L);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(
                10L,
                result.get(0).getInstructorId()
        );

        verify(courseRepository).findByInstructorId(10L);
    }


    @Test
    void updateCourse_ShouldUpdateCourseSuccessfully() {

        CourseRequest request = mock(CourseRequest.class);

        when(request.getTitle()).thenReturn("Updated Java");
        when(request.getDescription()).thenReturn("Updated Description");
        when(request.getCategory()).thenReturn("Programming");
        when(request.getInstructorName()).thenReturn(null);

        Course course = mock(Course.class);

        when(course.getId()).thenReturn(1L);
        when(course.getInstructorId()).thenReturn(10L);
        when(course.getTitle()).thenReturn("Updated Java");

        when(courseRepository.findById(1L))
                .thenReturn(Optional.of(course));

        when(courseRepository.save(course))
                .thenReturn(course);

        CourseResponse result =
                courseService.updateCourse(
                        1L,
                        request,
                        10L,
                        "INSTRUCTOR"
                );

        assertNotNull(result);

        verify(courseRepository).findById(1L);
        verify(courseRepository).save(course);

        verify(course).setTitle("Updated Java");
        verify(course).setDescription("Updated Description");
        verify(course).setCategory("Programming");
    }


    @Test
    void deleteCourse_ShouldDeleteCourseSuccessfully() {

        Course course = mock(Course.class);

        when(course.getInstructorId()).thenReturn(10L);

        when(courseRepository.findById(1L))
                .thenReturn(Optional.of(course));

        courseService.deleteCourse(
                1L,
                10L,
                "INSTRUCTOR"
        );

        verify(courseRepository).findById(1L);
        verify(courseRepository).delete(course);
    }


    @Test
    void publishCourse_ShouldPublishCourseSuccessfully() {

        Course course = mock(Course.class);

        when(course.getId()).thenReturn(1L);
        when(course.getInstructorId()).thenReturn(10L);
        when(course.getTitle()).thenReturn("Java Programming");

        when(courseRepository.findById(1L))
                .thenReturn(Optional.of(course));

        when(courseRepository.save(course))
                .thenReturn(course);

        CourseResponse result =
                courseService.publishCourse(
                        1L,
                        10L,
                        "INSTRUCTOR"
                );

        assertNotNull(result);

        verify(course).setPublished(true);
        verify(courseRepository).save(course);
    }


    @Test
    void updateCourse_WhenNotOwner_ShouldThrowException() {

        CourseRequest request = mock(CourseRequest.class);

        Course course = mock(Course.class);

        when(course.getInstructorId()).thenReturn(20L);

        when(courseRepository.findById(1L))
                .thenReturn(Optional.of(course));

        assertThrows(
                AccessDeniedException.class,
                () -> courseService.updateCourse(
                        1L,
                        request,
                        10L,
                        "INSTRUCTOR"
                )
        );

        verify(courseRepository, never())
                .save(any(Course.class));
    }


    @Test
    void updateCourse_AsAdmin_ShouldUpdateCourse() {

        CourseRequest request = mock(CourseRequest.class);

        when(request.getTitle()).thenReturn("Admin Updated Course");
        when(request.getDescription()).thenReturn("Updated");
        when(request.getCategory()).thenReturn("Programming");
        when(request.getInstructorName()).thenReturn(null);

        Course course = mock(Course.class);

        when(course.getId()).thenReturn(1L);
        when(course.getInstructorId()).thenReturn(20L);

        when(courseRepository.findById(1L))
                .thenReturn(Optional.of(course));

        when(courseRepository.save(course))
                .thenReturn(course);

        CourseResponse result =
                courseService.updateCourse(
                        1L,
                        request,
                        10L,
                        "ADMIN"
                );

        assertNotNull(result);

        verify(courseRepository).save(course);
    }
}