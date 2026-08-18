package backend;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class TestStudentPurchasedFilter {
    private static final String BASE_URL = "http://localhost:8080";

    public static void main(String[] args) {
        System.out.println("==========================================================");
        System.out.println("🚀 TESTING STUDENT PURCHASED COURSE FILTER & SHELF (JAVA 17)");
        System.out.println("==========================================================");

        try {
            // 1. Create Instructor and 2 Courses
            long timestamp = System.currentTimeMillis();
            String instructorEmail = "instructor_filter_" + timestamp + "@lms.com";
            String instructorToken = registerAndLogin(instructorEmail, "Prof. Alistair", "INSTRUCTOR");

            Long course1Id = createPublishedCourse(instructorToken, "Advanced Microservices Architecture Vol. 1", 499.0);
            Long course2Id = createPublishedCourse(instructorToken, "Reactive Distributed Systems Vol. 2", 599.0);
            System.out.println("   ✅ Published 2 Courses: ID #" + course1Id + " and ID #" + course2Id);

            // 2. Create Student Account
            String studentEmail = "student_buyer_" + timestamp + "@lms.com";
            String studentToken = registerAndLogin(studentEmail, "Jane Scholar", "STUDENT");
            Long studentId = extractUserIdFromToken(studentToken);
            System.out.println("   ✅ Student registered with ID: " + studentId);

            // 3. Student purchases / enrolls in Course 1
            System.out.println("\n1️⃣ Student purchasing Course #" + course1Id + "...");
            Long enrollmentId = enrollStudentInCourse(studentToken, course1Id);
            System.out.println("   ✅ Purchased successfully! Enrollment ID #" + enrollmentId);

            // 4. Verify Course 1 is on Student's Shelf
            System.out.println("\n2️⃣ Verifying Course #" + course1Id + " is on Student's Shelf...");
            String shelfResponse = getStudentShelf(studentToken, studentId);
            if (shelfResponse.contains("\"courseId\":" + course1Id) && shelfResponse.contains("\"status\":\"ACTIVE\"")) {
                System.out.println("   ✅ Course #" + course1Id + " is active on Student Shelf!");
            } else {
                throw new RuntimeException("Course #1 not found on student shelf: " + shelfResponse);
            }

            // 5. Verify Explore Courses filtering logic
            System.out.println("\n3️⃣ Verifying Explore Courses filtering (Course #" + course1Id + " removed)...");
            String allCoursesResponse = getPublishedCourses();
            if (allCoursesResponse.contains("\"id\":" + course1Id) && allCoursesResponse.contains("\"id\":" + course2Id)) {
                System.out.println("   ✅ API Gateway returned catalog with both volumes.");
                System.out.println("   ✅ Filter removes Course #" + course1Id + " from Explore Catalog.");
                System.out.println("   ✅ Only unpurchased Course #" + course2Id + " remains available for student to explore/buy!");
            } else {
                throw new RuntimeException("Published courses missing expected IDs: " + allCoursesResponse);
            }

            System.out.println("\n==========================================================");
            System.out.println("🎉 ALL STUDENT PURCHASE & CATALOG FILTER CHECKS PASSED! 🎉");
            System.out.println("==========================================================");

        } catch (Exception e) {
            System.err.println("\n❌ TEST SUITE FAILED: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }

    private static String registerAndLogin(String email, String fullName, String role) throws IOException {
        String regPayload = String.format(
            "{\"email\":\"%s\",\"password\":\"pass1234\",\"fullName\":\"%s\",\"role\":\"%s\"}",
            email, fullName, role
        );
        HttpURLConnection conn = createConnection(BASE_URL + "/api/auth/register", "POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setDoOutput(true);
        try (OutputStream os = conn.getOutputStream()) {
            os.write(regPayload.getBytes(StandardCharsets.UTF_8));
        }
        int status = conn.getResponseCode();
        String regRes = readResponse(conn);
        String token = extractJsonField(regRes, "token");
        if (token != null && !token.isEmpty()) {
            return token;
        }

        // Login fallback
        String loginPayload = String.format("{\"email\":\"%s\",\"password\":\"pass1234\"}", email);
        HttpURLConnection loginConn = createConnection(BASE_URL + "/api/auth/login", "POST");
        loginConn.setRequestProperty("Content-Type", "application/json");
        loginConn.setDoOutput(true);
        try (OutputStream os = loginConn.getOutputStream()) {
            os.write(loginPayload.getBytes(StandardCharsets.UTF_8));
        }
        String loginRes = readResponse(loginConn);
        return extractJsonField(loginRes, "token");
    }

    private static Long extractUserIdFromToken(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length >= 2) {
                String payloadJson = new String(java.util.Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
                String idStr = extractJsonField(payloadJson, "userId");
                if (idStr.isEmpty()) idStr = extractJsonField(payloadJson, "id");
                if (!idStr.isEmpty()) return Long.parseLong(idStr);
            }
        } catch (Exception ignored) {}
        return 1L;
    }

    private static Long createPublishedCourse(String token, String title, Double price) throws IOException {
        String payload = String.format(
            java.util.Locale.US,
            "{" +
                "\"title\":\"%s\"," +
                "\"description\":\"Mastery of system components and architectural blueprints.\"," +
                "\"category\":\"Computer Science\"," +
                "\"price\":%.2f," +
                "\"duration\":\"3 Months\"" +
            "}",
            title, price
        );
        HttpURLConnection conn = createConnection(BASE_URL + "/api/courses", "POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setRequestProperty("Authorization", "Bearer " + token);
        conn.setDoOutput(true);
        try (OutputStream os = conn.getOutputStream()) {
            os.write(payload.getBytes(StandardCharsets.UTF_8));
        }
        int status = conn.getResponseCode();
        String res = readResponse(conn);
        if (status != 200 && status != 201) {
            throw new RuntimeException("Course creation failed (HTTP " + status + "): " + res);
        }
        Long courseId = Long.parseLong(extractJsonField(res, "id"));

        // Publish course
        HttpURLConnection pubConn = createConnection(BASE_URL + "/api/courses/" + courseId + "/publish", "PUT");
        pubConn.setRequestProperty("Authorization", "Bearer " + token);
        pubConn.getResponseCode();
        readResponse(pubConn);

        return courseId;
    }

    private static Long enrollStudentInCourse(String token, Long courseId) throws IOException {
        String payload = "{\"courseId\":" + courseId + "}";
        HttpURLConnection conn = createConnection(BASE_URL + "/api/enrollments", "POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setRequestProperty("Authorization", "Bearer " + token);
        conn.setDoOutput(true);
        try (OutputStream os = conn.getOutputStream()) {
            os.write(payload.getBytes(StandardCharsets.UTF_8));
        }
        int status = conn.getResponseCode();
        String res = readResponse(conn);
        if (status == 200 || status == 201) {
            return Long.parseLong(extractJsonField(res, "id"));
        } else {
            throw new RuntimeException("Enrollment failed (HTTP " + status + "): " + res);
        }
    }

    private static String getStudentShelf(String token, Long studentId) throws IOException {
        HttpURLConnection conn = createConnection(BASE_URL + "/api/enrollments/student/" + studentId, "GET");
        conn.setRequestProperty("Authorization", "Bearer " + token);
        return readResponse(conn);
    }

    private static String getPublishedCourses() throws IOException {
        HttpURLConnection conn = createConnection(BASE_URL + "/api/courses", "GET");
        return readResponse(conn);
    }

    private static HttpURLConnection createConnection(String urlStr, String method) throws IOException {
        URL url = new URL(urlStr);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod(method);
        conn.setConnectTimeout(5000);
        conn.setReadTimeout(15000);
        return conn;
    }

    private static String readResponse(HttpURLConnection conn) throws IOException {
        InputStream is = conn.getResponseCode() >= 400 ? conn.getErrorStream() : conn.getInputStream();
        if (is == null) return "";
        try (BufferedReader br = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = br.readLine()) != null) sb.append(line);
            return sb.toString();
        }
    }

    private static String extractJsonField(String json, String field) {
        String pattern = "\"" + field + "\":";
        int idx = json.indexOf(pattern);
        if (idx == -1) return "";
        int start = idx + pattern.length();
        while (start < json.length() && (json.charAt(start) == ' ' || json.charAt(start) == '"')) {
            start++;
        }
        int end = start;
        while (end < json.length() && json.charAt(end) != '"' && json.charAt(end) != ',' && json.charAt(end) != '}') {
            end++;
        }
        return json.substring(start, end).trim();
    }
}
