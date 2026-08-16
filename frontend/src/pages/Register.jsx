import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import authService from "../services/authService";

const Register = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password || !role) {
      setError("Please fill in all required fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      await authService.register(fullName, email, password, role, bio);
      setLoading(false);
      if (role === "STUDENT") {
        navigate("/student/dashboard");
      } else if (role === "INSTRUCTOR") {
        navigate("/instructor/dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      setLoading(false);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Registration failed. Email might already be in use.");
      }
    }
  };

  return (
    <div style={{ minHeight: "calc(100vh - 76px)", display: "flex", alignItems: "stretch" }} className="fade-in">
      <div 
        style={{
          display: "flex",
          width: "100%",
          maxWidth: "1100px",
          margin: "3rem auto",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          boxShadow: "var(--shadow-lg)",
          backgroundColor: "var(--bg-card)"
        }}
      >
        {/* Left Side: Cover Illustration */}
        <div 
          style={{
            flex: "1 1 50%",
            background: "linear-gradient(135deg, var(--bg-secondary) 0%, var(--border-color) 100%)",
            borderRight: "1px solid var(--border-color)",
            padding: "4rem 3rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative"
          }}
          className="hide-mobile"
        >
          <div className="bookmark-accent" style={{ right: "3rem", height: "50px", backgroundColor: "var(--secondary)" }}></div>
          <div>
            <span className="editorial-title-badge">Scholar Enrollment</span>
            <h2 style={{ fontSize: "2.8rem", marginTop: "1rem", fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: "400" }}>
              "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice."
            </h2>
            <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.25rem", fontStyle: "italic", marginTop: "1rem" }}>
              &mdash; Brian Herbert
            </p>
          </div>
          <div>
            <h4 style={{ fontFamily: "var(--font-sans)", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.1em", fontWeight: "700" }}>
              Academic Registry &middot; LMS Space
            </h4>
          </div>
        </div>

        {/* Right Side: Form */}
        <div style={{ flex: "1 1 50%", padding: "3rem 3.5rem", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "2.25rem", marginBottom: "0.5rem" }}>Create Account</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
            Register to build your digital shelf and track your scholastic journey.
          </p>

          {error && (
            <div style={{ backgroundColor: "rgba(185, 28, 28, 0.12)", color: "var(--danger)", padding: "0.75rem 1rem", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", marginBottom: "1.5rem", border: "1px solid rgba(185, 28, 28, 0.3)" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="fullName">Full Name *</label>
              <input
                type="text"
                id="fullName"
                className="form-input"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                className="form-input"
                placeholder="student@lms.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Passphrase * (min 6 chars)</label>
              <input
                type="password"
                id="password"
                className="form-input"
                placeholder="Choose a secure key"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="role">Scholastic Objective *</label>
              <select
                id="role"
                className="form-input"
                style={{ backgroundColor: "var(--bg-primary)", cursor: "pointer" }}
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              >
                <option value="STUDENT">Learn (Student Scholar)</option>
                <option value="INSTRUCTOR">Instruct (Academic Author)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label className="form-label" htmlFor="bio">Author / Scholar Biography</label>
              <textarea
                id="bio"
                className="form-input"
                style={{ height: "70px", resize: "none" }}
                placeholder="Describe your fields of study or background..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "0.85rem 1.5rem" }} disabled={loading}>
              {loading ? "Registering Scholar..." : "Create Registry File"}
            </button>
          </form>

          <p style={{ marginTop: "1.5rem", fontSize: "0.85rem", textAlign: "center", color: "var(--text-muted)" }}>
            Already registered?{" "}
            <Link to="/login" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: "600", borderBottom: "1px solid var(--primary)" }}>
              Sign In
            </Link>
          </p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .hide-mobile {
            display: none !important;
          }
        }
      `}} />
    </div>
  );
};

export default Register;
