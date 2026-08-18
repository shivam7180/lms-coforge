import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import courseService from "../services/courseService";
import authService from "../services/authService";
import CourseMediaViewer from "../components/CourseMediaViewer";

const InstructorDashboard = () => {
  const user = authService.getCurrentUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedPreviewCourse, setSelectedPreviewCourse] = useState(null);

  // Check URL query parameters for course creation/update messages
  useEffect(() => {
    const msg = searchParams.get("msg");
    const courseTitle = searchParams.get("title");

    if (msg === "created") {
      setSuccess(
        courseTitle
          ? `🎉 You uploaded a course successfully: "${decodeURIComponent(courseTitle)}"! Your volume is now archived in your catalog.`
          : "🎉 You have uploaded a course successfully! Your volume is now recorded in your workspace."
      );
      // Clean query params after showing
      setSearchParams({}, { replace: true });
    } else if (msg === "updated") {
      setSuccess(
        courseTitle
          ? `✅ Course volume "${decodeURIComponent(courseTitle)}" updated successfully with latest notes and video lectures.`
          : "✅ Course volume updated successfully."
      );
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

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
      setSuccess("Course volume published successfully! Students can now discover and enroll in it.");
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
      setError("Failed to delete course. It may have active student enrollments.");
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid var(--border-color)", paddingBottom: "1.5rem", marginBottom: "3rem" }}>
          <div>
            <span className="editorial-title-badge">Composition Board</span>
            <h1 style={{ fontFamily: "var(--font-serif)", fontWeight: "400", margin: "0.5rem 0 0 0", fontSize: "2.5rem" }}>
              Academic Author <span style={{ fontStyle: "italic" }}>Workspace</span>
            </h1>
            <p style={{ margin: "0.35rem 0 0 0", color: "var(--text-muted)", fontSize: "0.95rem" }}>
              Manage your published syllabus, upload video lectures, and edit study notes.
            </p>
          </div>
          <Link to="/instructor/create-course" className="btn btn-primary btn-sm" style={{ padding: "0.6rem 1.25rem", fontSize: "0.9rem", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            <span>+</span> Upload New Course
          </Link>
        </div>

        {/* Upload Confirmation / Celebration Banner */}
        {success && (
          <div style={{
            backgroundColor: "rgba(46, 98, 60, 0.12)",
            color: "var(--success)",
            padding: "1.25rem 1.5rem",
            borderRadius: "var(--radius-md)",
            fontSize: "0.95rem",
            marginBottom: "2rem",
            border: "1px solid rgba(46, 98, 60, 0.35)",
            boxShadow: "var(--shadow-sm)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ fontSize: "1.6rem" }}>🎓</span>
              <div>
                <strong style={{ display: "block", fontSize: "1rem", color: "var(--success)" }}>Course Status Update</strong>
                <span>{success}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSuccess("")}
              style={{ background: "none", border: "none", color: "var(--success)", cursor: "pointer", fontSize: "1.2rem", fontWeight: "bold", padding: "0 0.5rem" }}
            >
              &times;
            </button>
          </div>
        )}

        {error && (
          <div style={{ backgroundColor: "rgba(185, 28, 28, 0.12)", color: "var(--danger)", padding: "0.75rem 1.25rem", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", marginBottom: "1.5rem", border: "1px solid rgba(185, 28, 28, 0.3)" }}>
            {error}
          </div>
        )}

        {/* Metrics Summary Strip */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1.25rem",
          marginBottom: "3rem"
        }}>
          <div className="reading-card" style={{ padding: "1.25rem 1.5rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>Total Volumes</span>
            <div style={{ fontSize: "2rem", fontWeight: "700", color: "var(--text-main)", marginTop: "0.25rem" }}>{courses.length}</div>
          </div>
          <div className="reading-card" style={{ padding: "1.25rem 1.5rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>Published & Live</span>
            <div style={{ fontSize: "2rem", fontWeight: "700", color: "var(--success)", marginTop: "0.25rem" }}>{courses.filter(c => c.published).length}</div>
          </div>
          <div className="reading-card" style={{ padding: "1.25rem 1.5rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>With Video Lectures</span>
            <div style={{ fontSize: "2rem", fontWeight: "700", color: "var(--accent)", marginTop: "0.25rem" }}>{courses.filter(c => c.videoUrl).length}</div>
          </div>
          <div className="reading-card" style={{ padding: "1.25rem 1.5rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>With Study Notes</span>
            <div style={{ fontSize: "2rem", fontWeight: "700", color: "var(--secondary)", marginTop: "0.25rem" }}>{courses.filter(c => c.notesUrl || c.notesContent).length}</div>
          </div>
        </div>

        {courses.length === 0 ? (
          <div className="reading-card text-center" style={{ padding: "5rem 2rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📖</div>
            <h3 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "1.8rem" }}>No Uploaded Courses Yet</h3>
            <p style={{ marginBottom: "2.5rem", color: "var(--text-muted)" }}>Upload your first course volume with video lectures and study notes today.</p>
            <Link to="/instructor/create-course" className="btn btn-primary">Upload & Compose Course</Link>
          </div>
        ) : (
          <div className="bookshelf-grid">
            {courses.map((course) => (
              <div key={course.id} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                
                {/* Book Cover Container */}
                <div className="book-card" style={{ cursor: "default" }}>
                  <div 
                    className="book-cover" 
                    style={{ borderLeftColor: getSpineColor(course.category), minHeight: "270px" }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%", gap: "0.5rem" }}>
                        <span className="book-cover-tag">{course.category}</span>
                        <span className={`badge ${course.published ? 'badge-active' : 'badge-cancelled'}`} style={{ fontSize: "0.6rem" }}>
                          {course.published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      <h3 className="book-cover-title" style={{ fontSize: "1.25rem", marginTop: "0.5rem" }}>{course.title}</h3>
                    </div>

                    <div>
                      {/* Media Badges */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.75rem" }}>
                        {(() => {
                          let videoCount = 0;
                          if (course.videosJson) {
                            try {
                              const parsed = JSON.parse(course.videosJson);
                              if (Array.isArray(parsed)) videoCount = parsed.length;
                            } catch (e) {}
                          }
                          if (videoCount > 1) {
                            return (
                              <span style={{ fontSize: "0.65rem", padding: "0.15rem 0.45rem", borderRadius: "3px", backgroundColor: "rgba(28, 61, 90, 0.18)", color: "var(--accent)", fontWeight: "600" }}>
                                📁 {videoCount} Lessons
                              </span>
                            );
                          } else if (videoCount === 1 || course.videoUrl) {
                            return (
                              <span style={{ fontSize: "0.65rem", padding: "0.15rem 0.45rem", borderRadius: "3px", backgroundColor: "rgba(28, 61, 90, 0.18)", color: "var(--accent)", fontWeight: "600" }}>
                                📹 Video
                              </span>
                            );
                          }
                          return null;
                        })()}
                        {(course.notesUrl || course.notesContent || course.notesJson) && (
                          <span style={{ fontSize: "0.65rem", padding: "0.15rem 0.45rem", borderRadius: "3px", backgroundColor: "rgba(46, 98, 60, 0.18)", color: "var(--success)", fontWeight: "600" }}>
                            📄 Notes
                          </span>
                        )}
                        {course.duration && (
                          <span style={{ fontSize: "0.65rem", padding: "0.15rem 0.45rem", borderRadius: "3px", backgroundColor: "rgba(59, 130, 246, 0.18)", color: "var(--primary)", fontWeight: "600" }}>
                            ⏱️ {course.duration}
                          </span>
                        )}
                      </div>

                      <span className="book-cover-author">Vol. #{course.id}</span>
                      <div className="book-cover-footer">
                        <span className="book-cover-price">₹{course.price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Management Desk Panel */}
                <div className="reading-card" style={{ padding: "1.25rem", borderTop: "none", borderRadius: "0 0 var(--radius-md) var(--radius-md)", marginTop: "-1.5rem" }}>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0 0 1rem 0", fontStyle: "italic", height: "42px", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {course.description.length > 90 ? `${course.description.substring(0, 90)}...` : course.description}
                  </p>

                  {/* Quick Preview Media Button */}
                  {(course.videoUrl || course.videosJson || course.notesUrl || course.notesContent || course.notesJson) && (
                    <button
                      type="button"
                      onClick={() => setSelectedPreviewCourse(course)}
                      className="btn btn-secondary btn-sm"
                      style={{ width: "100%", marginBottom: "0.75rem", padding: "0.35rem 0.75rem", fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
                    >
                      <span>👁️</span> Preview Videos & Notes
                    </button>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", borderTop: "1px solid var(--border-color)", paddingTop: "0.85rem" }}>
                    {/* Action Row: View, Edit, Delete */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.4rem" }}>
                      <Link 
                        to={`/courses/${course.id}`} 
                        className="btn btn-secondary btn-sm" 
                        style={{ padding: "0.4rem 0.25rem", fontSize: "0.8rem", textAlign: "center", justifyContent: "center" }}
                      >
                        View
                      </Link>
                      <Link 
                        to={`/instructor/edit-course/${course.id}`} 
                        className="btn btn-secondary btn-sm" 
                        style={{ padding: "0.4rem 0.25rem", fontSize: "0.8rem", textAlign: "center", justifyContent: "center" }}
                      >
                        Edit
                      </Link>
                      <button 
                        type="button"
                        onClick={() => handleDelete(course.id)} 
                        className="btn btn-danger btn-sm" 
                        style={{ padding: "0.4rem 0.25rem", fontSize: "0.8rem", textAlign: "center", justifyContent: "center" }}
                      >
                        Delete
                      </button>
                    </div>

                    {/* Publish Button (Placed below View, Edit, Delete within the card box) */}
                    {!course.published && (
                      <button 
                        type="button"
                        onClick={() => handlePublish(course.id)} 
                        className="btn btn-success btn-sm" 
                        style={{ 
                          width: "100%", 
                          padding: "0.5rem", 
                          fontSize: "0.82rem", 
                          fontWeight: "700", 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "center", 
                          gap: "0.4rem" 
                        }}
                      >
                        <span>🚀</span> Publish Course
                      </button>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* Media Preview Modal */}
        {selectedPreviewCourse && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1.5rem"
          }}>
            <div className="reading-card" style={{
              width: "100%",
              maxWidth: "850px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "2rem",
              position: "relative"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
                <div>
                  <span className="editorial-title-badge">Instructor Content Inspection</span>
                  <h3 style={{ margin: "0.25rem 0 0 0", fontFamily: "var(--font-serif)" }}>{selectedPreviewCourse.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPreviewCourse(null)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: "1.1rem", padding: "0.25rem 0.75rem" }}
                >
                  &times; Close
                </button>
              </div>

              <CourseMediaViewer
                videoUrl={selectedPreviewCourse.videoUrl}
                videosJson={selectedPreviewCourse.videosJson}
                notesUrl={selectedPreviewCourse.notesUrl}
                notesContent={selectedPreviewCourse.notesContent}
                title={selectedPreviewCourse.title}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default InstructorDashboard;
