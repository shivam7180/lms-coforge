import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import courseService from "../services/courseService";
import authService from "../services/authService";

const InstructorDashboard = () => {
  const user = authService.getCurrentUser();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadCourses = async () => {
    try {
      const data = await courseService.getCoursesByInstructor(user.userId);
      setCourses(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching instructor courses", err);
      setError("Failed to load your courses.");
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handlePublish = async (id) => {
    try {
      setError("");
      setSuccess("");
      await courseService.publishCourse(id);
      setSuccess("Course volume published successfully!");
      loadCourses();
    } catch (err) {
      setError("Failed to publish course.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this course volume? This cannot be undone.")) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      await courseService.deleteCourse(id);
      setSuccess("Course volume removed from library archive.");
      loadCourses();
    } catch (err) {
      setError("Failed to delete course. It may have student enrollments.");
    }
  };

  const getSpineColor = (category) => {
    switch (category) {
      case "Computer Science":
        return "#1c3d5a";
      case "Information Technology":
        return "#2e623c";
      case "Business & Finance":
        return "#b45309";
      case "Design & Art":
        return "#8c1d40";
      default:
        return "#6b6050";
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: "4rem 0" }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ padding: "4rem 0" }} className="fade-in">
      <div className="container">
        
        {/* Board Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid var(--border-color)", paddingBottom: "1.5rem", marginBottom: "3.5rem" }}>
          <div>
            <span className="editorial-title-badge">Composition Board</span>
            <h1 style={{ fontFamily: "var(--font-serif)", fontWeight: "400", margin: "0.5rem 0 0 0" }}>
              Academic Author <span style={{ fontStyle: "italic" }}>Workspace</span>
            </h1>
          </div>
          <Link to="/instructor/create-course" className="btn btn-primary btn-sm">
            + Write New Volume
          </Link>
        </div>

        {error && (
          <div style={{ backgroundColor: "rgba(185, 28, 28, 0.12)", color: "var(--danger)", padding: "0.75rem 1.25rem", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", marginBottom: "1.5rem", border: "1px solid rgba(185, 28, 28, 0.3)" }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ backgroundColor: "rgba(46, 98, 60, 0.12)", color: "var(--success)", padding: "0.75rem 1.25rem", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", marginBottom: "1.5rem", border: "1px solid rgba(46, 98, 60, 0.3)" }}>
            {success}
          </div>
        )}

        {courses.length === 0 ? (
          <div className="reading-card text-center" style={{ padding: "5rem 2rem" }}>
            <h3 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}>No Written Volumes Yet</h3>
            <p style={{ marginBottom: "2.5rem" }}>Get started by drafting and writing your first course volume today.</p>
            <Link to="/instructor/create-course" className="btn btn-primary btn-sm">Compose Course</Link>
          </div>
        ) : (
          <div className="bookshelf-grid">
            {courses.map((course) => (
              <div key={course.id} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                
                {/* Book Cover Container */}
                <div className="book-card" style={{ cursor: "default" }}>
                  <div 
                    className="book-cover" 
                    style={{ borderLeftColor: getSpineColor(course.category), minHeight: "260px" }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%" }}>
                        <span className="book-cover-tag">{course.category}</span>
                        <span className={`badge ${course.published ? 'badge-active' : 'badge-cancelled'}`} style={{ fontSize: "0.6rem" }}>
                          {course.published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      <h3 className="book-cover-title" style={{ fontSize: "1.3rem" }}>{course.title}</h3>
                    </div>
                    <div>
                      <span className="book-cover-author">Vol. #{course.id}</span>
                      <div className="book-cover-footer">
                        <span className="book-cover-price">₹{course.price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Management Desk Panel */}
                <div className="reading-card" style={{ padding: "1.25rem", borderTop: "none", borderRadius: "0 0 var(--radius-md) var(--radius-md)", marginTop: "-1.5rem" }}>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0 0 1.25rem 0", fontStyle: "italic", height: "48px", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {course.description.length > 100 ? `${course.description.substring(0, 100)}...` : course.description}
                  </p>

                  <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
                    {!course.published && (
                      <button onClick={() => handlePublish(course.id)} className="btn btn-success btn-sm" style={{ padding: "0.45rem 0.85rem" }}>
                        Publish
                      </button>
                    )}
                    <Link to={`/instructor/edit-course/${course.id}`} className="btn btn-secondary btn-sm" style={{ padding: "0.45rem 0.85rem" }}>
                      Edit
                    </Link>
                    <button onClick={() => handleDelete(course.id)} className="btn btn-danger btn-sm" style={{ padding: "0.45rem 0.85rem" }}>
                      Delete
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorDashboard;
