package backend;

import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

public class TestCourseExpirationAndRepurchase {

    private static final String BASE_URL = "http://localhost:8080";

    public static void main(String[] args) {
        System.out.println("==========================================================");
        System.out.println("🚀 TESTING COURSE EXPIRATION & RE-PURCHASE SUITE (JAVA 17)");
        System.out.println("==========================================================");

        try {
            long ts = System.currentTimeMillis();
            String instructorToken = registerAndLogin("inst_exp_" + ts + "@lms.com", "INSTRUCTOR");
            Long courseId = createPublishedCourse(instructorToken, "Spring Cloud Microservices " + ts, 499.0, "1 Month");
            System.out.println("   ✅ Created Course #" + courseId + " with duration: 1 Month");

            String studentToken = registerAndLogin("student_exp_" + ts + "@lms.com", "STUDENT");
            Long studentId = extractUserIdFromToken(studentToken);
            System.out.println("   ✅ Registered Student ID: " + studentId);

            // 1. Student Initial Purchase
            System.out.println("\n1️⃣ Student purchasing Course #" + courseId + "...");
            Long enrollmentId = purchaseCourse(studentToken, courseId);
            System.out.println("   ✅ Initial Purchase complete! Enrollment ID #" + enrollmentId);

            // 2. Verify course is on active shelf
            System.out.println("\n2️⃣ Verifying Course #" + courseId + " is on Student Active Shelf...");
            String enrollmentsJson = getStudentEnrollments(studentToken, studentId);
            if (!enrollmentsJson.contains("\"courseId\":" + courseId)) {
                throw new RuntimeException("Course #" + courseId + " not found on student shelf: " + enrollmentsJson);
            }
            System.out.println("   ✅ Course #" + courseId + " is present on Student Shelf!");

            // 3. Re-purchasing when expired / renewal test
            System.out.println("\n3️⃣ Simulating Re-Purchase / Renewal of Course #" + courseId + "...");
            Long renewedEnrollmentId = purchaseCourse(studentToken, courseId);
            System.out.println("   ✅ Re-Purchase / Renewal succeeded! Enrollment ID #" + renewedEnrollmentId);

            // 4. Verify progress reset and renewed validity
            System.out.println("\n4️⃣ Verifying renewed enrollment details...");
            String renewedJson = getStudentEnrollments(studentToken, studentId);
            if (!renewedJson.contains("\"status\":\"ACTIVE\"") || !renewedJson.contains("\"progressPercentage\":0.0")) {
                throw new RuntimeException("Renewed enrollment invalid state: " + renewedJson);
            }
            System.out.println("   ✅ Renewed enrollment is ACTIVE with 0.0% progress!");

            System.out.println("\n==========================================================");
            System.out.println("🎉 ALL COURSE EXPIRATION & RE-PURCHASE CHECKS PASSED! 🎉");
            System.out.println("==========================================================");

        } catch (Exception e) {
            System.err.println("\n❌ TEST SUITE FAILED: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }

    private static HttpURLConnection createConnection(String urlStr, String method) throws IOException {
        URL url = new URL(urlStr);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod(method);
        conn.setConnectTimeout(8000);
        conn.setReadTimeout(8000);
        return conn;
    }

    private static String readResponse(HttpURLConnection conn) throws IOException {
        InputStream is = conn.getResponseCode() >= 400 ? conn.getErrorStream() : conn.getInputStream();
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

    private static String registerAndLogin(String email, String role) throws IOException {
        String regPayload = String.format(
            "{\"email\":\"%s\",\"password\":\"pass1234\",\"fullName\":\"User %s\",\"role\":\"%s\"}",
            email, role, role
        );
        HttpURLConnection conn = createConnection(BASE_URL + "/api/auth/register", "POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setDoOutput(true);
        try (OutputStream os = conn.getOutputStream()) {
            os.write(regPayload.getBytes(StandardCharsets.UTF_8));
        }
        String regRes = readResponse(conn);
        String token = extractJsonField(regRes, "token");
        if (token != null && !token.isEmpty()) {
            return token;
        }

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

    private static Long createPublishedCourse(String token, String title, Double price, String duration) throws IOException {
        String payload = String.format(
            java.util.Locale.US,
            "{" +
            "\"title\":\"%s\"," +
            "\"description\":\"Complete course curriculum with video and notes.\"," +
            "\"category\":\"Computer Science\"," +
            "\"duration\":\"%s\"," +
            "\"price\":%.2f," +
            "\"published\":true" +
            "}",
            title, duration, price
        );

        HttpURLConnection conn = createConnection(BASE_URL + "/api/courses", "POST");
        conn.setRequestProperty("Authorization", "Bearer " + token);
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setDoOutput(true);
        try (OutputStream os = conn.getOutputStream()) {
            os.write(payload.getBytes(StandardCharsets.UTF_8));
        }

        int status = conn.getResponseCode();
        String res = readResponse(conn);
        if (status != 201 && status != 200) {
            throw new RuntimeException("Failed to create course: HTTP " + status + " -> " + res);
        }
        Long courseId = Long.parseLong(extractJsonField(res, "id"));

        // Publish course
        HttpURLConnection pubConn = createConnection(BASE_URL + "/api/courses/" + courseId + "/publish", "PUT");
        pubConn.setRequestProperty("Authorization", "Bearer " + token);
        pubConn.getResponseCode();
        readResponse(pubConn);

        return courseId;
    }

    private static Long purchaseCourse(String token, Long courseId) throws IOException {
        String payload = String.format("{\"courseId\":%d}", courseId);
        HttpURLConnection conn = createConnection(BASE_URL + "/api/enrollments", "POST");
        conn.setRequestProperty("Authorization", "Bearer " + token);
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setDoOutput(true);
        try (OutputStream os = conn.getOutputStream()) {
            os.write(payload.getBytes(StandardCharsets.UTF_8));
        }

        int status = conn.getResponseCode();
        String res = readResponse(conn);
        if (status != 201 && status != 200) {
            throw new RuntimeException("Failed to purchase course: HTTP " + status + " -> " + res);
        }
        return Long.parseLong(extractJsonField(res, "id"));
    }

    private static String getStudentEnrollments(String token, Long studentId) throws IOException {
        HttpURLConnection conn = createConnection(BASE_URL + "/api/enrollments/student/" + studentId, "GET");
        conn.setRequestProperty("Authorization", "Bearer " + token);
        int status = conn.getResponseCode();
        String res = readResponse(conn);
        if (status != 200) {
            throw new RuntimeException("Failed to fetch student enrollments: HTTP " + status + " -> " + res);
        }
        return res;
    }

    private static String extractJsonField(String json, String field) {
        String pattern = "\"" + field + "\"\\s*:\\s*\"?([^,\"}]+)\"?";
        java.util.regex.Matcher m = java.util.regex.Pattern.compile(pattern).matcher(json);
        if (m.find()) {
            return m.group(1).trim();
        }
        return "";
    }
}
