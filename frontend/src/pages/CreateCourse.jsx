import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import courseService from "../services/courseService";

const CreateCourse = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Computer Science");
  const [price, setPrice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    setLoading(true);

    try {
      await courseService.createCourse({
        title,
        description,
        category,
        price: parsedPrice,
      });
      setLoading(false);
      navigate("/instructor/dashboard?msg=created");
    } catch (err) {
      setLoading(false);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Failed to compose course. Please check connection and try again.");
      }
    }
  };

  return (
    <div style={{ padding: "4rem 0", display: "flex", justifyContent: "center" }} className="fade-in">
      <div className="reading-card" style={{ width: "100%", maxWidth: "650px", padding: "3rem", position: "relative" }}>
        <div className="bookmark-accent" style={{ height: "45px" }}></div>
        
        <Link to="/instructor/dashboard" style={{ color: "var(--text-muted)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.5rem", marginBottom: "2rem", fontWeight: "600", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          &larr; Back to board
        </Link>
        
        <h2 style={{ marginBottom: "0.5rem", fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: "400" }}>Compose Course Volume</h2>
        <p style={{ marginBottom: "2.5rem", color: "var(--text-muted)" }}>Draft course syllabus, pricing value, and description fields.</p>

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
              placeholder="e.g., Introduction to Microservices"
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
              placeholder="Write a clear book syllabus and abstract notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "0.85rem 1.5rem" }} disabled={loading}>
            {loading ? "Filing volume details..." : "Save Draft Volume"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateCourse;
