import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import courseService from "../services/courseService";

const EditCourse = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const course = await courseService.getCourseById(id);
        setTitle(course.title);
        setDescription(course.description);
        setCategory(course.category);
        setPrice(course.price.toString());
        setLoading(false);
      } catch (err) {
        console.error("Error loading course for edit", err);
        setError("Failed to load course details.");
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !category || !price) {
      setError("Please fill in all fields.");
      return;
    }
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError("Price must be a positive number.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      await courseService.updateCourse(id, {
        title,
        description,
        category,
        price: parsedPrice,
      });
      setSubmitting(false);
      navigate("/instructor/dashboard?msg=updated");
    } catch (err) {
      setSubmitting(false);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Failed to update course volume. Please try again.");
      }
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
    <div style={{ padding: "4rem 0", display: "flex", justifyContent: "center" }} className="fade-in">
      <div className="reading-card" style={{ width: "100%", maxWidth: "650px", padding: "3rem", position: "relative" }}>
        <div className="bookmark-accent" style={{ height: "45px", backgroundColor: "var(--secondary)" }}></div>
        
        <Link to="/instructor/dashboard" style={{ color: "var(--text-muted)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.5rem", marginBottom: "2rem", fontWeight: "600", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          &larr; Back to board
        </Link>
        
        <h2 style={{ marginBottom: "0.5rem", fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: "400" }}>Edit Course Volume</h2>
        <p style={{ marginBottom: "2.5rem", color: "var(--text-muted)" }}>Update course text structure, category, and tuition settings.</p>

        {error && (
          <div style={{ backgroundColor: "rgba(185, 28, 28, 0.12)", color: "var(--danger)", padding: "0.75rem 1.25rem", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", marginBottom: "1.5rem", border: "1px solid rgba(185, 28, 28, 0.3)" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="title">Volume Title *</label>
            <input
              type="text"
              id="title"
              className="form-input"
              style={{ backgroundColor: "var(--bg-primary)" }}
              placeholder="e.g., Intro to Microservices"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="category">Catalog Category *</label>
            <select
              id="category"
              className="form-input"
              style={{ backgroundColor: "var(--bg-primary)", cursor: "pointer" }}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="Computer Science">Computer Science</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Business & Finance">Business & Finance</option>
              <option value="Design & Art">Design & Art</option>
              <option value="Marketing">Marketing</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="price">Tuition / Access Value (INR - ₹) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              id="price"
              className="form-input"
              style={{ backgroundColor: "var(--bg-primary)" }}
              placeholder="e.g., 499"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: "2.5rem" }}>
            <label className="form-label" htmlFor="description">Volume Abstract Description *</label>
            <textarea
              id="description"
              className="form-input"
              style={{ height: "150px", resize: "none", backgroundColor: "var(--bg-primary)" }}
              placeholder="Write a compelling course outline..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "0.85rem 1.5rem" }} disabled={submitting}>
            {submitting ? "Updating registry file..." : "Save Edits"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditCourse;
