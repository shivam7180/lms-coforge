package backend;

import java.sql.*;

public class InspectAndCleanTestData {

    private static final String DB_USER = "root";
    private static final String DB_PASS = "shivam07";

    public static void main(String[] args) {
        System.out.println("=================================================");
        System.out.println("🔍 INSPECTING COURSES & USERS IN MYSQL DATABASES");
        System.out.println("=================================================");

        try (
            Connection userConn = DriverManager.getConnection("jdbc:mysql://localhost:3306/lms_user_db", DB_USER, DB_PASS);
            Connection courseConn = DriverManager.getConnection("jdbc:mysql://localhost:3306/lms_course_db", DB_USER, DB_PASS);
            Connection enrollConn = DriverManager.getConnection("jdbc:mysql://localhost:3306/lms_enrollment_db", DB_USER, DB_PASS)
        ) {
            // 2. List all Courses (1-25)
            System.out.println("\n--- COURSES 1 TO 25 (lms_course_db.courses) ---");
            try (Statement stmt = courseConn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT id, title, category, instructor_id, instructor_name, price, published, created_at FROM courses ORDER BY id ASC LIMIT 25")) {
                while (rs.next()) {
                    System.out.printf("Course #%d: \"%s\" | Cat: %s | InstId: %d | InstName: %s | Price: %.2f | Pub: %b | Created: %s\n",
                        rs.getLong("id"),
                        rs.getString("title"),
                        rs.getString("category"),
                        rs.getLong("instructor_id"),
                        rs.getString("instructor_name"),
                        rs.getDouble("price"),
                        rs.getBoolean("published"),
                        rs.getString("created_at")
                    );
                }
            }

            // 3. List all Enrollments
            System.out.println("\n--- ALL ENROLLMENTS (lms_enrollment_db.enrollments) ---");
            try (Statement stmt = enrollConn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT id, student_id, course_id, status, progress_percentage, enrolled_at FROM enrollments")) {
                while (rs.next()) {
                    System.out.printf("Enrollment #%d: Student #%d -> Course #%d | Status: %s | Progress: %.1f%% | Date: %s\n",
                        rs.getLong("id"),
                        rs.getLong("student_id"),
                        rs.getLong("course_id"),
                        rs.getString("status"),
                        rs.getDouble("progress_percentage"),
                        rs.getString("enrolled_at")
                    );
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
