package com.lms.courseservice.service.impl;

import static org.junit.jupiter.api.Assertions.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.Resource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import com.lms.courseservice.exception.BadRequestException;
import com.lms.courseservice.exception.ResourceNotFoundException;

class FileStorageServiceImplTest {

    private final FileStorageServiceImpl fileStorageService =
            new FileStorageServiceImpl();


    // Test 1: Store a valid file
    @Test
    void storeFile_ShouldStoreFileSuccessfully() throws Exception {

        MultipartFile file = new MockMultipartFile(
                "file",
                "test.txt",
                "text/plain",
                "Hello World".getBytes()
        );

        String fileName =
                fileStorageService.storeFile(file, "notes");

        assertNotNull(fileName);
        assertTrue(fileName.startsWith("notes_"));
        assertTrue(fileName.endsWith(".txt"));

        Path storedFile = Path.of("uploads").toAbsolutePath()
                .normalize()
                .resolve(fileName);

        assertTrue(Files.exists(storedFile));
    }


    // Test 2: Empty file
    @Test
    void storeFile_WhenFileIsEmpty_ShouldThrowException() {

        MultipartFile file = new MockMultipartFile(
                "file",
                "empty.txt",
                "text/plain",
                new byte[0]
        );

        assertThrows(
                BadRequestException.class,
                () -> fileStorageService.storeFile(file, "notes")
        );
    }


    // Test 3: Null file
    @Test
    void storeFile_WhenFileIsNull_ShouldThrowException() {

        assertThrows(
                BadRequestException.class,
                () -> fileStorageService.storeFile(null, "notes")
        );
    }


    // Test 4: Invalid filename
    @Test
    void storeFile_WhenFilenameIsInvalid_ShouldThrowException() {

        MultipartFile file = new MockMultipartFile(
                "file",
                "../test.txt",
                "text/plain",
                "Hello".getBytes()
        );

        assertThrows(
                BadRequestException.class,
                () -> fileStorageService.storeFile(file, "notes")
        );
    }


    // Test 5: Load existing file as Resource
    @Test
    void loadFileAsResource_ShouldReturnResource() throws Exception {

        Path uploadDirectory = Path.of("uploads")
                .toAbsolutePath()
                .normalize();

        Path testFile = uploadDirectory.resolve("resource-test.txt");

        Files.writeString(testFile, "Test Content");

        Resource resource =
                fileStorageService.loadFileAsResource("resource-test.txt");

        assertNotNull(resource);
        assertTrue(resource.exists());
        assertTrue(resource.isReadable());

        Files.deleteIfExists(testFile);
    }


    // Test 6: Load non-existing file as Resource
    @Test
    void loadFileAsResource_WhenFileNotFound_ShouldThrowException() {

        assertThrows(
                ResourceNotFoundException.class,
                () -> fileStorageService.loadFileAsResource(
                        "does-not-exist.txt"
                )
        );
    }


    // Test 7: Load existing file as Path
    @Test
    void loadFileAsPath_ShouldReturnPath() throws Exception {

        Path uploadDirectory = Path.of("uploads")
                .toAbsolutePath()
                .normalize();

        Path testFile = uploadDirectory.resolve("path-test.txt");

        Files.writeString(testFile, "Test Content");

        Path result =
                fileStorageService.loadFileAsPath("path-test.txt");

        assertNotNull(result);
        assertTrue(Files.exists(result));
        assertTrue(Files.isReadable(result));

        Files.deleteIfExists(testFile);
    }


    // Test 8: Load non-existing file as Path
    @Test
    void loadFileAsPath_WhenFileNotFound_ShouldThrowException() {

        assertThrows(
                ResourceNotFoundException.class,
                () -> fileStorageService.loadFileAsPath(
                        "does-not-exist.txt"
                )
        );
    }


    // Test 9: MP4 content type
    @Test
    void getContentType_ForMp4_ShouldReturnCorrectType() {

        String result =
                fileStorageService.getContentType("video.mp4");

        assertEquals("video/mp4", result);
    }


    // Test 10: PDF content type
    @Test
    void getContentType_ForPdf_ShouldReturnCorrectType() {

        String result =
                fileStorageService.getContentType("notes.pdf");

        assertEquals("application/pdf", result);
    }


    // Test 11: Image content type
    @Test
    void getContentType_ForJpg_ShouldReturnCorrectType() {

        String result =
                fileStorageService.getContentType("image.jpg");

        assertEquals("image/jpeg", result);
    }


    // Test 12: Unknown content type
    @Test
    void getContentType_ForUnknownFile_ShouldReturnDefaultType() {

        String result =
                fileStorageService.getContentType("file.xyz");

        assertEquals(
                "application/octet-stream",
                result
        );
    }


    // Test 13: Null filename
    @Test
    void getContentType_WhenFilenameIsNull_ShouldReturnDefaultType() {

        String result =
                fileStorageService.getContentType(null);

        assertEquals(
                "application/octet-stream",
                result
        );
    }
}