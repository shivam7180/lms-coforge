import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import courseService from "../services/courseService";
import enrollmentService from "../services/enrollmentService";
import authService from "../services/authService";
import { calculateDaysLeft } from "../utils/courseExpiry";

const Courses = () => {
  const user = authService.getCurrentUser();
  const [searchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        let data = await courseService.getPublishedCourses();
        
        // If user is a logged-in student, hide active unexpired purchased courses from Explore Catalog
        // Expired courses will automatically reappear in Explore Courses so the student can re-purchase
        if (user && user.role === "STUDENT") {
          try {
            const studentId = user.userId || user.id;
            const enrollments = await enrollmentService.getEnrollmentsByStudent(studentId);
            
            const activeUnexpiredIds = new Set(
              enrollments
                .filter((e) => {
                  if (e.status !== "ACTIVE") return false;
                  const isCompleted = (e.progressPercentage || 0) >= 100 || (typeof localStorage !== "undefined" && !!localStorage.getItem(`quiz_passed_${e.id}`));
                  if (isCompleted) return true; // Permanently owned & completed
                  const matchedCourse = data.find((c) => c.id === e.courseId);
                  const daysLeft = calculateDaysLeft(e, matchedCourse);
                  return daysLeft !== null ? daysLeft >= 0 : true;
                })
                .map((e) => e.courseId)
            );

            setEnrolledCount(activeUnexpiredIds.size);
            data = data.filter((course) => !activeUnexpiredIds.has(course.id));
          } catch (enrollErr) {
            console.warn("Could not retrieve enrollments to filter catalog", enrollErr);
          }
        }

        setCourses(data);
        const cats = new Set(data.map((c) => c.category));
        setCategories(["ALL", ...Array.from(cats)]);
        
        // Respect pre-selected category parameter from landing page
        const catParam = searchParams.get("category");
        if (catParam) {
          setSelectedCategory(catParam);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching courses", err);
        setLoading(false);
      }
    };
    fetchCourses();
  }, [searchParams]);

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "ALL" || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Dynamic spine colors matching the editorial theme
  const getSpineColor = (category) => {
    switch (category) {
      case "Computer Science":
        return "#1c3d5a"; // Oxford Blue
      case "Information Technology":
        return "#2e623c"; // Sage/Ivy Green
      case "Business & Finance":
        return "#b45309"; // Terracotta
      case "Design & Art":
        return "#8c1d40"; // Crimson Burgundy
      default:
        return "#6b6050"; // Graphite/Muted Brown
    }
  };

  return (
    <div style={{ padding: "4rem 0" }} className="fade-in">
      <div className="container">
        <span className="editorial-title-badge">Library Catalog</span>
        <h1 style={{ marginBottom: "1rem", fontFamily: "var(--font-serif)", fontWeight: "400" }}>
          Explore <span style={{ fontStyle: "italic" }}>Volumes</span>
        </h1>
        <p style={{ marginBottom: "2rem", fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "1.15rem" }}>
          Select and acquire new textbook titles for self-paced study.
        </p>

        {/* Student Active Shelf Notice */}
        {user?.role === "STUDENT" && enrolledCount > 0 && (
          <div 
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "rgba(46, 98, 60, 0.12)",
              border: "1px solid rgba(46, 98, 60, 0.3)",
              borderRadius: "var(--radius-md)",
              padding: "0.85rem 1.25rem",
              marginBottom: "2.5rem",
              flexWrap: "wrap",
              gap: "1rem"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ fontSize: "1.4rem" }}>📚</span>
              <div>
                <strong style={{ color: "var(--success)", display: "block", fontSize: "0.9rem" }}>
                  You have {enrolledCount} purchased volume{enrolledCount > 1 ? "s" : ""} on your bookshelf
                </strong>
                <small style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                  Already enrolled courses are hidden from the explore catalog and accessible in your personal shelf.
                </small>
              </div>
            </div>
            <Link to="/student/dashboard" className="btn btn-secondary btn-sm" style={{ borderColor: "var(--success)", color: "var(--success)", fontSize: "0.8rem", padding: "0.35rem 0.75rem" }}>
              Open My Shelf &rarr;
            </Link>
          </div>
        )}

        {/* Filter Panel */}
        <div 
          style={{ 
            backgroundColor: "var(--bg-secondary)", 
            border: "1px solid var(--border-color)", 
            padding: "1.5rem", 
            borderRadius: "var(--radius-md)", 
            marginBottom: "3.5rem", 
            display: "flex", 
            gap: "1.25rem", 
            flexWrap: "wrap", 
            alignItems: "center" 
          }}
        >
          <div style={{ flex: 1, minWidth: "250px" }}>
            <label className="form-label" style={{ marginBottom: "0.25rem" }}>Search Library Index</label>
            <input
              type="text"
              className="form-input"
              style={{ backgroundColor: "var(--bg-card)" }}
              placeholder="Search by keywords or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ minWidth: "200px" }}>
            <label className="form-label" style={{ marginBottom: "0.25rem" }}>Subject Category</label>
            <select
              className="form-input"
              style={{ backgroundColor: "var(--bg-card)", cursor: "pointer" }}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "ALL" ? "All Subjects" : cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Catalog Grid */}
        {loading ? (
          <div className="spinner"></div>
        ) : filteredCourses.length === 0 ? (
          user?.role === "STUDENT" && enrolledCount > 0 && selectedCategory === "ALL" && !searchQuery ? (
            <div className="reading-card text-center" style={{ padding: "4rem 2rem" }}>
              <span style={{ fontSize: "3rem", display: "block", marginBottom: "1rem" }}>🎉</span>
              <h3 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", marginBottom: "0.5rem" }}>
                You Have Purchased All Available Volumes!
              </h3>
              <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem", maxWidth: "500px", margin: "0 auto 1.5rem auto" }}>
                Every volume currently published in the library is already safely archived on your personal bookshelf.
              </p>
              <Link to="/student/dashboard" className="btn btn-primary">
                Open My Shelf &rarr;
              </Link>
            </div>
          ) : (
            <div className="reading-card text-center" style={{ padding: "5rem 2rem" }}>
              <h3 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}>No Cataloged Titles Found</h3>
              <p style={{ margin: 0 }}>Try clearing filters or looking for another keyword.</p>
            </div>
          )
        ) : (
          <div>
            <div className="bookshelf-grid">
              {filteredCourses.map((course) => (
                <Link key={course.id} to={`/courses/${course.id}`} className="book-card">
                  <div 
                    className="book-cover" 
                    style={{ borderLeftColor: getSpineColor(course.category) }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                        <span className="book-cover-tag">{course.category}</span>
                        {course.duration && (
                          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: "600" }}>
                            ⏱️ {course.duration}
                          </span>
                        )}
                      </div>
                      <h3 className="book-cover-title">{course.title}</h3>
                    </div>
                    <div>
                      <div className="book-cover-author" style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.82rem", color: "var(--text-main)", fontWeight: "600", marginBottom: "0.5rem" }}>
                        <span>👨‍🏫</span>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {course.instructorName || "Lead Instructor"}
                        </span>
                      </div>
                      <div className="book-cover-footer">
                        <span className="book-cover-price">₹{course.price.toFixed(2)}</span>
                        <span style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--primary)" }}>
                          View &rarr;
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;
