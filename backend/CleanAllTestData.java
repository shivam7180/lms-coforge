package backend;

import java.sql.*;
import java.util.*;

public class CleanAllTestData {

    private static final String DB_USER = "root";
    private static final String DB_PASS = "shivam07";

    // Set of manual course IDs to preserve
    private static final Set<Long> MANUAL_COURSE_IDS = new HashSet<>(Arrays.asList(1L, 2L, 3L, 4L, 5L, 8L, 10L, 47L, 48L));

    // Set of real user IDs to preserve
    private static final Set<Long> REAL_USER_IDS = new HashSet<>(Arrays.asList(1L, 2L, 3L, 4L, 5L, 6L, 7L, 13L, 58L));

    public static void main(String[] args) {
        System.out.println("=================================================");
        System.out.println("🧹 CLEANING UP AUTOMATED TEST COURSES & USERS");
        System.out.println("=================================================");

        try (
            Connection userConn = DriverManager.getConnection("jdbc:mysql://localhost:3306/lms_user_db", DB_USER, DB_PASS);
            Connection courseConn = DriverManager.getConnection("jdbc:mysql://localhost:3306/lms_course_db", DB_USER, DB_PASS);
            Connection enrollConn = DriverManager.getConnection("jdbc:mysql://localhost:3306/lms_enrollment_db", DB_USER, DB_PASS)
        ) {
            // 1. Delete test enrollments (enrollments for test courses OR test students)
            System.out.println("\n1️⃣ Deleting test enrollments...");
            int deletedEnrollments = 0;
            try (Statement stmt = enrollConn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT id, course_id, student_id FROM enrollments")) {
                List<Long> toDelete = new ArrayList<>();
                while (rs.next()) {
                    long id = rs.getLong("id");
                    long courseId = rs.getLong("course_id");
                    long studentId = rs.getLong("student_id");
                    if (!MANUAL_COURSE_IDS.contains(courseId) || !REAL_USER_IDS.contains(studentId)) {
                        toDelete.add(id);
                    }
                }
                for (Long id : toDelete) {
                    try (PreparedStatement ps = enrollConn.prepareStatement("DELETE FROM enrollments WHERE id = ?")) {
                        ps.setLong(1, id);
                        deletedEnrollments += ps.executeUpdate();
                    }
                }
            }
            System.out.printf("   ✅ Removed %d test enrollment records.\n", deletedEnrollments);

            // 2. Delete test courses
            System.out.println("\n2️⃣ Deleting test courses...");
            int deletedCourses = 0;
            try (Statement stmt = courseConn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT id, title, instructor_id FROM courses")) {
                List<Long> toDelete = new ArrayList<>();
                while (rs.next()) {
                    long id = rs.getLong("id");
                    if (!MANUAL_COURSE_IDS.contains(id)) {
                        toDelete.add(id);
                    }
                }
                for (Long id : toDelete) {
                    try (PreparedStatement ps = courseConn.prepareStatement("DELETE FROM courses WHERE id = ?")) {
                        ps.setLong(1, id);
                        deletedCourses += ps.executeUpdate();
                    }
                }
            }
            System.out.printf("   ✅ Removed %d test courses.\n", deletedCourses);

            // 3. Delete test users
            System.out.println("\n3️⃣ Deleting test users...");
            int deletedUsers = 0;
            try (Statement stmt = userConn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT id, email FROM users")) {
                List<Long> toDelete = new ArrayList<>();
                while (rs.next()) {
                    long id = rs.getLong("id");
                    if (!REAL_USER_IDS.contains(id)) {
                        toDelete.add(id);
                    }
                }
                for (Long id : toDelete) {
                    try (PreparedStatement ps = userConn.prepareStatement("DELETE FROM users WHERE id = ?")) {
                        ps.setLong(1, id);
                        deletedUsers += ps.executeUpdate();
                    }
                }
            }
            System.out.printf("   ✅ Removed %d test user accounts.\n", deletedUsers);

            // 4. Verification Summary
            System.out.println("\n=================================================");
            System.out.println("✨ VERIFICATION: REMAINING MANUAL COURSES & USERS");
            System.out.println("=================================================");

            System.out.println("\n--- REMAINING COURSES IN DB ---");
            try (Statement stmt = courseConn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT id, title, category, instructor_name, price, published FROM courses ORDER BY id ASC")) {
                while (rs.next()) {
                    System.out.printf("Course #%d: \"%s\" | %s | Instructor: %s | ₹%.2f | Published: %b\n",
                        rs.getLong("id"),
                        rs.getString("title"),
                        rs.getString("category"),
                        rs.getString("instructor_name"),
                        rs.getDouble("price"),
                        rs.getBoolean("published")
                    );
                }
            }

            System.out.println("\n--- REMAINING USERS IN DB ---");
            try (Statement stmt = userConn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT id, email, full_name, role FROM users ORDER BY id ASC")) {
                while (rs.next()) {
                    System.out.printf("User #%d: %s | %s | %s\n",
                        rs.getLong("id"),
                        rs.getString("email"),
                        rs.getString("full_name"),
                        rs.getString("role")
                    );
                }
            }

            System.out.println("\n--- REMAINING ENROLLMENTS IN DB ---");
            try (Statement stmt = enrollConn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT id, student_id, course_id, status, progress_percentage FROM enrollments ORDER BY id ASC")) {
                while (rs.next()) {
                    System.out.printf("Enrollment #%d: Student #%d -> Course #%d | Status: %s | Progress: %.1f%%\n",
                        rs.getLong("id"),
                        rs.getLong("student_id"),
                        rs.getLong("course_id"),
                        rs.getString("status"),
                        rs.getDouble("progress_percentage")
                    );
                }
            }

            System.out.println("\n🎉 CLEANUP COMPLETED PERFECTLY! 🎉");

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
