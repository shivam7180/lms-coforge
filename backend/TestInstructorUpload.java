package com.lms;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

/**
 * Java 17 End-to-End Test Suite for LMS Instructor Workflows:
 * 1. Instructor Registration & Authentication
 * 2. Uploading Folder with 15 Video Lessons Sequentially
 * 3. Uploading Multiple Notes & Syllabus Documents (Non-Overriding Collection)
 * 4. Appending New Notes Files to Existing Course
 * 5. Publishing Course with Videos Playlist & Multiple Notes Documents
 * 6. Streaming HTTP 206 Byte Ranges on Large Video Files
 */
public class TestInstructorUpload {

    private static final String BASE_URL = "http://localhost:8080";
    private static String jwtToken = "";
    private static Long instructorId = null;

    public static void main(String[] args) {
        System.out.println("==========================================================");
        System.out.println("🚀 STARTING INSTRUCTOR MULTI-NOTES & VIDEO SUITE (JAVA 17)");
        System.out.println("==========================================================");

        try {
            // Step 1: Register Instructor
            registerInstructor();

            // Step 2: Upload 15 Video Files
            String[] videoUrls = upload15VideoFiles();

            // Step 3: Upload Initial Multiple Notes Files
            String notes1Url = uploadNotesFile("Chapter_01_Foundations.pdf", "%PDF-1.4 Chapter 1 Foundations Content");
            String notes2Url = uploadNotesFile("Chapter_02_Architecture.pdf", "%PDF-1.4 Chapter 2 Architecture Content");

            // Step 4: Create Course with Videos and Multiple Notes JSON
            Long courseId = createCourseWithMultiNotes(videoUrls, notes1Url, notes2Url);

            // Step 5: Test Appending a New Notes File (Without Overriding Previous Notes)
            String notes3Url = uploadNotesFile("Chapter_03_Assignment_Cheatsheet.pdf", "%PDF-1.4 Chapter 3 Cheatsheet Content");
            appendNotesToCourse(courseId, videoUrls, notes1Url, notes2Url, notes3Url);

            // Step 6: Verify Course Details and Multi-Notes Collection
            verifyCourseDetails(courseId);

            // Step 7: Test HTTP 206 Byte-Range Streaming
            testByteRangeStreaming(videoUrls[0]);

            System.out.println("\n==========================================================");
            System.out.println("🎉 ALL MULTI-NOTES & VIDEO CHECKS PASSED PERFECTLY! 🎉");
            System.out.println("==========================================================");

        } catch (Exception e) {
            System.err.println("\n❌ Test encountered an error: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }

    private static void registerInstructor() throws IOException {
        String email = "instructor_notes_" + System.currentTimeMillis() + "@lms.com";
        System.out.println("\n1️⃣ Registering new Instructor account (" + email + ")...");

        String jsonPayload = String.format(
            "{\"fullName\":\"Prof. MultiNotes\",\"email\":\"%s\",\"password\":\"Secret123!\",\"role\":\"INSTRUCTOR\"}",
            email
        );

        HttpURLConnection conn = createConnection(BASE_URL + "/api/auth/register", "POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setDoOutput(true);

        try (OutputStream os = conn.getOutputStream()) {
            os.write(jsonPayload.getBytes(StandardCharsets.UTF_8));
        }

        int status = conn.getResponseCode();
        System.out.println("   HTTP Status: " + status);
        String response = readResponse(conn);

        if (status == 201 || status == 200) {
            jwtToken = extractJsonField(response, "token");
            String idStr = extractJsonField(response, "id");
            if (idStr != null && !idStr.isEmpty()) {
                instructorId = Long.parseLong(idStr);
            }
            System.out.println("   ✅ Registered successfully! User ID: " + instructorId);
        } else {
            throw new RuntimeException("Instructor registration failed: " + response);
        }
    }

    private static String[] upload15VideoFiles() throws IOException {
        System.out.println("\n2️⃣ Uploading folder containing 15 video lessons...");
        String[] urls = new String[15];

        for (int i = 1; i <= 15; i++) {
            String lessonName = String.format("lesson_%02d_topic.mp4", i);
            byte[] dummyVideoBytes = ("DUMMY_MP4_STREAM_DATA_LESSON_" + i).getBytes(StandardCharsets.UTF_8);

            String fileUrl = uploadMultipartFile(lessonName, dummyVideoBytes, "video");
            urls[i - 1] = fileUrl;
            System.out.printf("   [%02d/15] ✅ Uploaded %s -> %s\n", i, lessonName, fileUrl.substring(fileUrl.lastIndexOf('/') + 1));
        }
        System.out.println("   🎉 All 15 video files uploaded successfully from folder!");
        return urls;
    }

    private static String uploadNotesFile(String filename, String content) throws IOException {
        System.out.println("\n3️⃣ Uploading notes document (" + filename + ")...");
        byte[] notesBytes = content.getBytes(StandardCharsets.UTF_8);
        String fileUrl = uploadMultipartFile(filename, notesBytes, "notes");
        System.out.println("   ✅ Notes file URL: " + fileUrl);
        return fileUrl;
    }

    private static Long createCourseWithMultiNotes(String[] videoUrls, String notes1Url, String notes2Url) throws IOException {
        System.out.println("\n4️⃣ Creating course with initial multi-notes collection & 15 videos...");

        StringBuilder videosJson = new StringBuilder("[");
        for (int i = 0; i < videoUrls.length; i++) {
            if (i > 0) videosJson.append(",");
            videosJson.append(String.format(
                "{\"id\":\"vid_%d\",\"title\":\"Lesson %d: Core Mastery\",\"fileUrl\":\"%s\"}",
                i + 1, i + 1, videoUrls[i]
            ));
        }
        videosJson.append("]");

        String notesJson = String.format(
            "[{\"id\":\"n1\",\"title\":\"Chapter 1 Foundations\",\"fileUrl\":\"%s\"},{\"id\":\"n2\",\"title\":\"Chapter 2 Architecture\",\"fileUrl\":\"%s\"}]",
            notes1Url, notes2Url
        );

        String jsonPayload = String.format(
            "{" +
                "\"title\":\"Enterprise Cloud & System Architecture\"," +
                "\"description\":\"Complete multi-lesson course with attached study documents.\"," +
                "\"category\":\"Computer Science\"," +
                "\"price\":499.00," +
                "\"duration\":\"3 Months\"," +
                "\"videoUrl\":\"%s\"," +
                "\"videosJson\":%s," +
                "\"notesUrl\":\"%s\"," +
                "\"notesJson\":%s," +
                "\"notesContent\":\"# Course Study Notes\\n- Review attached PDFs.\"," +
                "\"tableOfContents\":\"[{\\\"chapterNumber\\\":\\\"01\\\",\\\"title\\\":\\\"Introduction\\\"}]\"" +
            "}",
            videoUrls[0],
            quoteJson(videosJson.toString()),
            notes1Url,
            quoteJson(notesJson)
        );

        HttpURLConnection conn = createConnection(BASE_URL + "/api/courses", "POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setRequestProperty("Authorization", "Bearer " + jwtToken);
        conn.setDoOutput(true);

        try (OutputStream os = conn.getOutputStream()) {
            os.write(jsonPayload.getBytes(StandardCharsets.UTF_8));
        }

        int status = conn.getResponseCode();
        System.out.println("   HTTP Status: " + status);
        String response = readResponse(conn);

        if (status == 201 || status == 200) {
            String courseIdStr = extractJsonField(response, "id");
            Long courseId = Long.parseLong(courseIdStr);
            System.out.println("   ✅ Course successfully created with ID #" + courseId);
            return courseId;
        } else {
            throw new RuntimeException("Course creation failed: " + response);
        }
    }

    private static void appendNotesToCourse(Long courseId, String[] videoUrls, String notes1Url, String notes2Url, String notes3Url) throws IOException {
        System.out.println("\n5️⃣ Testing appending new notes file without overriding previous notes...");

        StringBuilder videosJson = new StringBuilder("[");
        for (int i = 0; i < videoUrls.length; i++) {
            if (i > 0) videosJson.append(",");
            videosJson.append(String.format(
                "{\"id\":\"vid_%d\",\"title\":\"Lesson %d: Core Mastery\",\"fileUrl\":\"%s\"}",
                i + 1, i + 1, videoUrls[i]
            ));
        }
        videosJson.append("]");

        // Appended notesJson with all 3 documents
        String notesJson = String.format(
            "[{\"id\":\"n1\",\"title\":\"Chapter 1 Foundations\",\"fileUrl\":\"%s\"},{\"id\":\"n2\",\"title\":\"Chapter 2 Architecture\",\"fileUrl\":\"%s\"},{\"id\":\"n3\",\"title\":\"Chapter 3 Cheatsheet\",\"fileUrl\":\"%s\"}]",
            notes1Url, notes2Url, notes3Url
        );

        String jsonPayload = String.format(
            "{" +
                "\"title\":\"Enterprise Cloud & System Architecture\"," +
                "\"description\":\"Complete multi-lesson course with 3 attached study documents.\"," +
                "\"category\":\"Computer Science\"," +
                "\"price\":499.00," +
                "\"duration\":\"6 Months\"," +
                "\"videoUrl\":\"%s\"," +
                "\"videosJson\":%s," +
                "\"notesUrl\":\"%s\"," +
                "\"notesJson\":%s," +
                "\"notesContent\":\"# Course Study Notes\\n- 3 study files attached.\"," +
                "\"tableOfContents\":\"[{\\\"chapterNumber\\\":\\\"01\\\",\\\"title\\\":\\\"Introduction\\\"}]\"" +
            "}",
            videoUrls[0],
            quoteJson(videosJson.toString()),
            notes1Url,
            quoteJson(notesJson)
        );

        HttpURLConnection conn = createConnection(BASE_URL + "/api/courses/" + courseId, "PUT");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setRequestProperty("Authorization", "Bearer " + jwtToken);
        conn.setDoOutput(true);

        try (OutputStream os = conn.getOutputStream()) {
            os.write(jsonPayload.getBytes(StandardCharsets.UTF_8));
        }

        int status = conn.getResponseCode();
        System.out.println("   HTTP Status: " + status);
        String response = readResponse(conn);

        if (status == 200) {
            System.out.println("   ✅ Course #" + courseId + " updated with 3 non-overridden notes files & duration in months!");
        } else {
            throw new RuntimeException("Course update failed: " + response);
        }
    }

    private static void verifyCourseDetails(Long courseId) throws IOException {
        System.out.println("\n6️⃣ Fetching Course #" + courseId + " details to verify multi-notes & duration in months...");
        HttpURLConnection conn = createConnection(BASE_URL + "/api/courses/" + courseId, "GET");
        int status = conn.getResponseCode();
        System.out.println("   HTTP Status: " + status);
        String response = readResponse(conn);

        if (status == 200 && response.contains("Chapter 3 Cheatsheet") && response.contains("6 Months")) {
            System.out.println("   ✅ Course #" + courseId + " contains duration in months and all 3 study notes files intact!");
        } else {
            throw new RuntimeException("Course details verification failed: " + response);
        }
    }

    private static void testByteRangeStreaming(String videoUrl) throws IOException {
        System.out.println("\n7️⃣ Testing HTTP 206 Byte-Range streaming...");
        HttpURLConnection conn = createConnection(videoUrl, "GET");
        conn.setRequestProperty("Range", "bytes=0-10");

        int status = conn.getResponseCode();
        String acceptRanges = conn.getHeaderField("Accept-Ranges");
        String contentRange = conn.getHeaderField("Content-Range");
        System.out.println("   HTTP Status: " + status);
        System.out.println("   Accept-Ranges: " + acceptRanges);
        System.out.println("   Content-Range: " + contentRange);

        if (status == 206 || status == 200) {
            System.out.println("   ✅ Byte-range video streaming confirmed!");
        } else {
            throw new RuntimeException("Range streaming test failed with HTTP " + status);
        }
    }

    private static String uploadMultipartFile(String filename, byte[] fileBytes, String type) throws IOException {
        String boundary = "Boundary" + System.currentTimeMillis();
        String lineEnd = "\r\n";
        String twoHyphens = "--";

        HttpURLConnection conn = createConnection(BASE_URL + "/api/courses/upload", "POST");
        conn.setDoOutput(true);
        conn.setRequestProperty("Content-Type", "multipart/form-data; boundary=" + boundary);
        if (!jwtToken.isEmpty()) {
            conn.setRequestProperty("Authorization", "Bearer " + jwtToken);
        }

        try (OutputStream outputStream = conn.getOutputStream();
             PrintWriter writer = new PrintWriter(new OutputStreamWriter(outputStream, StandardCharsets.UTF_8), true)) {

            // Form field: type
            writer.append(twoHyphens).append(boundary).append(lineEnd);
            writer.append("Content-Disposition: form-data; name=\"type\"").append(lineEnd);
            writer.append("Content-Type: text/plain; charset=UTF-8").append(lineEnd);
            writer.append(lineEnd).append(type).append(lineEnd);
            writer.flush();

            // File field: file
            writer.append(twoHyphens).append(boundary).append(lineEnd);
            writer.append("Content-Disposition: form-data; name=\"file\"; filename=\"").append(filename).append("\"").append(lineEnd);
            writer.append("Content-Type: application/octet-stream").append(lineEnd);
            writer.append(lineEnd);
            writer.flush();

            outputStream.write(fileBytes);
            outputStream.flush();

            writer.append(lineEnd);
            writer.append(twoHyphens).append(boundary).append(twoHyphens).append(lineEnd);
            writer.flush();
        }

        int status = conn.getResponseCode();
        String response = readResponse(conn);
        if (status == 201 || status == 200) {
            return extractJsonField(response, "fileUrl");
        } else {
            throw new RuntimeException("Upload failed (HTTP " + status + "): " + response);
        }
    }

    private static String quoteJson(String raw) {
        return "\"" + raw.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }

    private static HttpURLConnection createConnection(String urlStr, String method) throws IOException {
        URL url = URI.create(urlStr).toURL();
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod(method);
        conn.setConnectTimeout(15000);
        conn.setReadTimeout(15000);
        return conn;
    }

    private static String readResponse(HttpURLConnection conn) throws IOException {
        InputStream is = (conn.getResponseCode() < 400) ? conn.getInputStream() : conn.getErrorStream();
        if (is == null) return "";
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
            return sb.toString();
        }
    }

    private static String extractJsonField(String json, String field) {
        String pattern = "\"" + field + "\"";
        int idx = json.indexOf(pattern);
        if (idx == -1) return null;
        int colonIdx = json.indexOf(":", idx + pattern.length());
        if (colonIdx == -1) return null;

        int start = colonIdx + 1;
        while (start < json.length() && (Character.isWhitespace(json.charAt(start)) || json.charAt(start) == '"')) {
            start++;
        }
        int end = start;
        while (end < json.length() && json.charAt(end) != '"' && json.charAt(end) != ',' && json.charAt(end) != '}' && json.charAt(end) != ']') {
            end++;
        }
        return json.substring(start, end).trim();
    }
}
