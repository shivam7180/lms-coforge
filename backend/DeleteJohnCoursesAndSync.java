package backend;

import java.sql.*;

public class DeleteJohnCoursesAndSync {

    private static final String DB_USER = "root";
    private static final String DB_PASS = "shivam07";

    public static void main(String[] args) {
        System.out.println("=================================================");
        System.out.println("🗑️ DELETING COURSES FROM PROFESSOR JOHN (INST ID #2)");
        System.out.println("=================================================");

        try (
            Connection courseConn = DriverManager.getConnection("jdbc:mysql://localhost:3306/lms_course_db", DB_USER, DB_PASS);
            Connection enrollConn = DriverManager.getConnection("jdbc:mysql://localhost:3306/lms_enrollment_db", DB_USER, DB_PASS)
        ) {
            // 1. Find all course IDs for Professor John (instructor_id = 2 OR instructor_name LIKE '%John%')
            java.util.List<Long> johnCourseIds = new java.util.ArrayList<>();
            try (PreparedStatement ps = courseConn.prepareStatement("SELECT id, title FROM courses WHERE instructor_id = 2 OR instructor_name LIKE '%John%'")) {
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        long cId = rs.getLong("id");
                        String title = rs.getString("title");
                        johnCourseIds.add(cId);
                        System.out.printf("   Found Professor John course: #%d - \"%s\"\n", cId, title);
                    }
                }
            }

            if (johnCourseIds.isEmpty()) {
                System.out.println("   ℹ️ No courses found for Professor John.");
            } else {
                // 2. Cascade delete enrollments for these courses
                int totalDeletedEnrollments = 0;
                for (Long cId : johnCourseIds) {
                    try (PreparedStatement ps = enrollConn.prepareStatement("DELETE FROM enrollments WHERE course_id = ?")) {
                        ps.setLong(1, cId);
                        int count = ps.executeUpdate();
                        totalDeletedEnrollments += count;
                        System.out.printf("   ✅ Removed %d student enrollment(s) for Course #%d.\n", count, cId);
                    }
                }

                // 3. Delete courses from courses table
                int totalDeletedCourses = 0;
                for (Long cId : johnCourseIds) {
                    try (PreparedStatement ps = courseConn.prepareStatement("DELETE FROM courses WHERE id = ?")) {
                        ps.setLong(1, cId);
                        int count = ps.executeUpdate();
                        totalDeletedCourses += count;
                        System.out.printf("   ✅ Deleted Course #%d from courses catalog.\n", cId);
                    }
                }

                System.out.printf("\n🎉 Successfully deleted %d courses and %d enrollments for Professor John!\n",
                    totalDeletedCourses, totalDeletedEnrollments);
            }

            // 4. Verification: Print remaining courses in DB
            System.out.println("\n--- REMAINING COURSES IN DB ---");
            try (Statement stmt = courseConn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT id, title, category, instructor_id, instructor_name, price, published FROM courses ORDER BY id ASC")) {
                while (rs.next()) {
                    System.out.printf("Course #%d: \"%s\" | Cat: %s | Instructor: %s (ID: %d) | ₹%.2f | Published: %b\n",
                        rs.getLong("id"),
                        rs.getString("title"),
                        rs.getString("category"),
                        rs.getString("instructor_name"),
                        rs.getLong("instructor_id"),
                        rs.getDouble("price"),
                        rs.getBoolean("published")
                    );
                }
            }

            // 5. Verification: Print remaining enrollments in DB
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

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
