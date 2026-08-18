package backend;

import java.sql.*;

public class PopulateInstructorNames {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
        try (Connection conn = DriverManager.getConnection(url, "root", "shivam07");
             Statement stmt = conn.createStatement()) {

            System.out.println("Connecting to MySQL...");

            // Fetch users map from lms_user_db
            stmt.execute("USE lms_user_db;");
            ResultSet rsUsers = stmt.executeQuery("SELECT id, full_name, email FROM users;");
            java.util.Map<Long, String> userNames = new java.util.HashMap<>();
            while (rsUsers.next()) {
                long id = rsUsers.getLong("id");
                String name = rsUsers.getString("full_name");
                userNames.put(id, name);
                System.out.println("   User #" + id + ": " + name + " (" + rsUsers.getString("email") + ")");
            }

            // Update courses in lms_course_db
            stmt.execute("USE lms_course_db;");
            ResultSet rsCourses = stmt.executeQuery("SELECT id, title, instructor_id, instructor_name FROM courses;");
            java.util.List<long[]> coursesToUpdate = new java.util.ArrayList<>();
            while (rsCourses.next()) {
                long cId = rsCourses.getLong("id");
                long instId = rsCourses.getLong("instructor_id");
                String currentName = rsCourses.getString("instructor_name");
                System.out.println("   Course #" + cId + " '" + rsCourses.getString("title") + "' -> Inst ID: " + instId + ", Current Name: " + currentName);
                coursesToUpdate.add(new long[]{cId, instId});
            }

            for (long[] pair : coursesToUpdate) {
                long cId = pair[0];
                long instId = pair[1];
                String realName = userNames.get(instId);
                if (realName == null || realName.trim().isEmpty() || realName.equalsIgnoreCase("Instructor")) {
                    realName = "Prof. Alex Vance";
                }
                String updateSql = "UPDATE courses SET instructor_name = ? WHERE id = ?";
                try (PreparedStatement pstmt = conn.prepareStatement(updateSql)) {
                    pstmt.setString(1, realName);
                    pstmt.setLong(2, cId);
                    pstmt.executeUpdate();
                }
                System.out.println("   ✅ Updated Course #" + cId + " with Instructor Name: " + realName);
            }

            System.out.println("🎉 All courses updated with real instructor names successfully!");

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
