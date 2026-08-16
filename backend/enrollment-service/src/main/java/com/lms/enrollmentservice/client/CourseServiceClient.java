package com.lms.enrollmentservice.client;

import com.lms.enrollmentservice.dto.CourseResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "course-service")
public interface CourseServiceClient {

    @GetMapping("/api/courses/{id}")
    CourseResponse getCourseById(@PathVariable("id") Long id);
}
