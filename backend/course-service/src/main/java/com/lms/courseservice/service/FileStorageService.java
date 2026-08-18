package com.lms.courseservice.service;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Path;

public interface FileStorageService {
    String storeFile(MultipartFile file, String fileType);
    Resource loadFileAsResource(String fileName);
    Path loadFileAsPath(String fileName);
    String getContentType(String fileName);
}
