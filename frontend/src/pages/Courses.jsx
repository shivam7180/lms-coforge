import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import courseService from "../services/courseService";

const Courses = () => {
  const [searchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await courseService.getPublishedCourses();
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
          Published <span style={{ fontStyle: "italic" }}>Volumes</span>
        </h1>
        <p style={{ marginBottom: "3rem", fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "1.15rem" }}>
          Select and retrieve textbook titles for immediate self-paced study.
        </p>

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
          <div className="reading-card text-center" style={{ padding: "5rem 2rem" }}>
            <h3 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}>No Cataloged Titles Found</h3>
            <p style={{ margin: 0 }}>Try clearing filters or looking for another keyword.</p>
          </div>
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
                      <span className="book-cover-tag">{course.category}</span>
                      <h3 className="book-cover-title">{course.title}</h3>
                    </div>
                    <div>
                      <div className="book-cover-author">ID: #{course.id}</div>
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
