package com.lms.courseservice.controller;

import com.lms.courseservice.dto.CourseRequest;
import com.lms.courseservice.dto.CourseResponse;
import com.lms.courseservice.exception.ResourceNotFoundException;
import com.lms.courseservice.service.CourseService;
import com.lms.courseservice.service.FileStorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.IOException;
import java.io.InputStream;
import java.io.RandomAccessFile;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;
    private final FileStorageService fileStorageService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "type", defaultValue = "general") String type) {
        String fileName = fileStorageService.storeFile(file, type);
        String fileUrl = "http://localhost:8080/api/courses/files/" + fileName;

        Map<String, String> response = new HashMap<>();
        response.put("fileName", fileName);
        response.put("fileUrl", fileUrl);
        response.put("originalName", file.getOriginalFilename());
        response.put("fileType", type);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping(value = "/upload-multiple", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<Map<String, String>>> uploadMultipleFiles(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam(value = "type", defaultValue = "general") String type) {
        List<Map<String, String>> uploadedList = new java.util.ArrayList<>();
        if (files != null) {
            for (MultipartFile file : files) {
                if (!file.isEmpty()) {
                    String fileName = fileStorageService.storeFile(file, type);
                    String fileUrl = "http://localhost:8080/api/courses/files/" + fileName;

                    Map<String, String> item = new HashMap<>();
                    item.put("fileName", fileName);
                    item.put("fileUrl", fileUrl);
                    item.put("originalName", file.getOriginalFilename());
                    item.put("fileType", type);
                    uploadedList.add(item);
                }
            }
        }
        return new ResponseEntity<>(uploadedList, HttpStatus.CREATED);
    }

    @GetMapping("/files/{fileName:.+}")
    public ResponseEntity<StreamingResponseBody> getFile(
            @PathVariable String fileName,
            @RequestHeader(value = "Range", required = false) String rangeHeader) throws IOException {
        Path filePath = fileStorageService.loadFileAsPath(fileName);
        if (!Files.exists(filePath)) {
            throw new ResourceNotFoundException("File not found: " + fileName);
        }

        long fileLength = Files.size(filePath);
        String contentType = fileStorageService.getContentType(fileName);

        if (rangeHeader == null || rangeHeader.isBlank() || !rangeHeader.startsWith("bytes=")) {
            StreamingResponseBody responseBody = outputStream -> {
                try (InputStream inputStream = Files.newInputStream(filePath)) {
                    inputStream.transferTo(outputStream);
                }
            };
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(fileLength))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                    .body(responseBody);
        }

        // Handle Range: bytes=START-END
        String rangeValue = rangeHeader.substring("bytes=".length()).trim();
        String[] parts = rangeValue.split("-");
        long start = 0;
        try {
            start = Long.parseLong(parts[0]);
        } catch (NumberFormatException ignored) {}

        long end = (parts.length > 1 && !parts[1].isBlank()) ? Long.parseLong(parts[1]) : fileLength - 1;
        if (end >= fileLength) {
            end = fileLength - 1;
        }

        long contentLength = end - start + 1;
        final long rangeStart = start;
        final long rangeEnd = end;

        StreamingResponseBody responseBody = outputStream -> {
            try (RandomAccessFile raf = new RandomAccessFile(filePath.toFile(), "r")) {
                raf.seek(rangeStart);
                byte[] buffer = new byte[64 * 1024];
                long bytesRemaining = contentLength;
                while (bytesRemaining > 0) {
                    int bytesToRead = (int) Math.min(buffer.length, bytesRemaining);
                    int bytesRead = raf.read(buffer, 0, bytesToRead);
                    if (bytesRead == -1) break;
                    outputStream.write(buffer, 0, bytesRead);
                    bytesRemaining -= bytesRead;
                }
                outputStream.flush();
            }
        };

        return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .header(HttpHeaders.CONTENT_RANGE, "bytes " + rangeStart + "-" + rangeEnd + "/" + fileLength)
                .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(contentLength))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                .body(responseBody);
    }

    @PostMapping
    public ResponseEntity<CourseResponse> createCourse(
            @Valid @RequestBody CourseRequest request,
            Authentication authentication) {
        Long userId = (Long) authentication.getCredentials();
        String role = authentication.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
        return new ResponseEntity<>(courseService.createCourse(request, userId, role), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<CourseResponse>> getAllCourses() {
        return ResponseEntity.ok(courseService.getAllCourses());
    }

    @GetMapping("/published")
    public ResponseEntity<List<CourseResponse>> getPublishedCourses() {
        return ResponseEntity.ok(courseService.getPublishedCourses());
    }

    @GetMapping("/instructor/{instructorId}")
    public ResponseEntity<List<CourseResponse>> getCoursesByInstructor(@PathVariable Long instructorId) {
        return ResponseEntity.ok(courseService.getCoursesByInstructor(instructorId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CourseResponse> getCourseById(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.getCourseById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CourseResponse> updateCourse(
            @PathVariable Long id,
            @Valid @RequestBody CourseRequest request,
            Authentication authentication) {
        Long userId = (Long) authentication.getCredentials();
        String role = authentication.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
        return ResponseEntity.ok(courseService.updateCourse(id, request, userId, role));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteCourse(
            @PathVariable Long id,
            Authentication authentication) {
        Long userId = (Long) authentication.getCredentials();
        String role = authentication.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
        courseService.deleteCourse(id, userId, role);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Course deleted successfully");
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/publish")
    public ResponseEntity<CourseResponse> publishCourse(
            @PathVariable Long id,
            Authentication authentication) {
        Long userId = (Long) authentication.getCredentials();
        String role = authentication.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
        return ResponseEntity.ok(courseService.publishCourse(id, userId, role));
    }
}
