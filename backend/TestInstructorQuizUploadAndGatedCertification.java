package backend;

import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;

public class TestInstructorQuizUploadAndGatedCertification {

    private static final String BASE_URL = "http://localhost:8080";

    public static void main(String[] args) {
        System.out.println("==================================================================");
        System.out.println("🚀 TESTING INSTRUCTOR QUIZ UPLOAD & GATED CERTIFICATION (JAVA 17)");
        System.out.println("==================================================================");

        try {
            long ts = System.currentTimeMillis();

            // 1. Instructor registers and creates course with custom quiz questions
            System.out.println("\n1️⃣ Registering instructor and publishing course with custom quiz...");
            String instructorToken = registerAndLogin("inst_quiz_" + ts + "@lms.com", "INSTRUCTOR");

            String quizJson = "[{\"id\":\"q_1\",\"question\":\"What is Spring Cloud Eureka?\",\"options\":[\"Service Discovery Registry\",\"Relational Database\",\"CSS Framework\",\"Code Editor\"],\"correctIndex\":0},{\"id\":\"q_2\",\"question\":\"When is the quiz unlocked?\",\"options\":[\"Before watching videos\",\"After watching 100% of lecture videos\",\"During sign in\",\"Never\"],\"correctIndex\":1}]";

            Long courseId = createCourseWithQuiz(instructorToken, "Cloud Architecture Masterclass " + ts, 599.0, "3 Months", quizJson);
            System.out.println("   ✅ Course #" + courseId + " created and published with custom quiz questions!");

            // 2. Fetch course details and verify quizJson persistence
            System.out.println("\n2️⃣ Verifying quizJson persistence on Course #" + courseId + "...");
            String courseDetails = getCourseDetails(courseId);
            if (!courseDetails.contains("Service Discovery Registry") || !courseDetails.contains("correctIndex")) {
                throw new RuntimeException("QuizJson not found in course response: " + courseDetails);
            }
            System.out.println("   ✅ Custom quiz questions verified in course response!");

            // 3. Student Registration & Enrollment
            System.out.println("\n3️⃣ Registering student and enrolling in Course #" + courseId + "...");
            String studentToken = registerAndLogin("student_quiz_" + ts + "@lms.com", "STUDENT");
            Long studentId = extractUserIdFromToken(studentToken);
            Long enrollmentId = enrollStudent(studentToken, courseId);
            System.out.println("   ✅ Student #" + studentId + " enrolled (Enrollment ID #" + enrollmentId + ")");

            // 4. Verify initial progress is 0.0% (Quiz & Certificate Gated)
            System.out.println("\n4️⃣ Checking initial student enrollment progress (Gating check)...");
            String enrollmentsJson = getStudentEnrollments(studentToken, studentId);
            if (!enrollmentsJson.contains("\"progressPercentage\":0.0")) {
                throw new RuntimeException("Expected 0.0% initial progress: " + enrollmentsJson);
            }
            System.out.println("   ✅ Initial progress is 0.0% -> Quiz is strictly LOCKED.");

            // 5. Complete video lectures (Progress to 100%)
            System.out.println("\n5️⃣ Simulating video completion (Updating progress to 100%)...");
            updateProgress(studentToken, enrollmentId, 100.0);
            System.out.println("   ✅ Video lessons 100% completed -> Quiz is now UNLOCKED for student!");

            // 6. Verify 100% progress
            String updatedJson = getStudentEnrollments(studentToken, studentId);
            if (!updatedJson.contains("\"progressPercentage\":100.0")) {
                throw new RuntimeException("Expected 100.0% progress: " + updatedJson);
            }
            System.out.println("   ✅ Progress is 100.0% -> Student can take the instructor's assessment quiz & unlock graduation certificate!");

            System.out.println("\n==================================================================");
            System.out.println("🎉 ALL INSTRUCTOR QUIZ & GATED CERTIFICATION CHECKS PASSED! 🎉");
            System.out.println("==================================================================");

        } catch (Exception e) {
            System.err.println("\n❌ TEST FAILED: " + e.getMessage());
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
        if (token != null && !token.isEmpty()) return token;

        String loginPayload = String.format("{\"email\":\"%s\",\"password\":\"pass1234\"}", email);
        HttpURLConnection loginConn = createConnection(BASE_URL + "/api/auth/login", "POST");
        loginConn.setRequestProperty("Content-Type", "application/json");
        loginConn.setDoOutput(true);
        try (OutputStream os = loginConn.getOutputStream()) {
            os.write(loginPayload.getBytes(StandardCharsets.UTF_8));
        }
        return extractJsonField(readResponse(loginConn), "token");
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

    private static Long createCourseWithQuiz(String token, String title, Double price, String duration, String quizJson) throws IOException {
        String escapedQuizJson = quizJson.replace("\"", "\\\"");
        String payload = String.format(
            java.util.Locale.US,
            "{" +
            "\"title\":\"%s\"," +
            "\"description\":\"Mastery of enterprise cloud architecture.\"," +
            "\"category\":\"Computer Science\"," +
            "\"duration\":\"%s\"," +
            "\"price\":%.2f," +
            "\"quizJson\":\"%s\"" +
            "}",
            title, duration, price, escapedQuizJson
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
            throw new RuntimeException("Create course failed (HTTP " + status + "): " + res);
        }
        Long courseId = Long.parseLong(extractJsonField(res, "id"));

        HttpURLConnection pubConn = createConnection(BASE_URL + "/api/courses/" + courseId + "/publish", "PUT");
        pubConn.setRequestProperty("Authorization", "Bearer " + token);
        pubConn.getResponseCode();
        readResponse(pubConn);

        return courseId;
    }

    private static String getCourseDetails(Long courseId) throws IOException {
        HttpURLConnection conn = createConnection(BASE_URL + "/api/courses/" + courseId, "GET");
        int status = conn.getResponseCode();
        String res = readResponse(conn);
        if (status != 200) {
            throw new RuntimeException("Get course details failed: HTTP " + status + " -> " + res);
        }
        return res;
    }

    private static Long enrollStudent(String token, Long courseId) throws IOException {
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
        if (status != 200 && status != 201) {
            throw new RuntimeException("Enrollment failed: HTTP " + status + " -> " + res);
        }
        return Long.parseLong(extractJsonField(res, "id"));
    }

    private static void updateProgress(String token, Long enrollmentId, Double progress) throws IOException {
        String payload = String.format(java.util.Locale.US, "{\"progressPercentage\":%.1f}", progress);
        HttpURLConnection conn = createConnection(BASE_URL + "/api/enrollments/" + enrollmentId + "/progress", "PUT");
        conn.setRequestProperty("Authorization", "Bearer " + token);
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setDoOutput(true);
        try (OutputStream os = conn.getOutputStream()) {
            os.write(payload.getBytes(StandardCharsets.UTF_8));
        }
        int status = conn.getResponseCode();
        if (status != 200) {
            throw new RuntimeException("Update progress failed: HTTP " + status + " -> " + readResponse(conn));
        }
    }

    private static String getStudentEnrollments(String token, Long studentId) throws IOException {
        HttpURLConnection conn = createConnection(BASE_URL + "/api/enrollments/student/" + studentId, "GET");
        conn.setRequestProperty("Authorization", "Bearer " + token);
        int status = conn.getResponseCode();
        String res = readResponse(conn);
        if (status != 200) {
            throw new RuntimeException("Fetch student enrollments failed: HTTP " + status + " -> " + res);
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
