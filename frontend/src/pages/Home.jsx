import React from "react";
import { Link } from "react-router-dom";
import authService from "../services/authService";

const Home = () => {
  const user = authService.getCurrentUser();

  return (
    <div style={{ padding: "5rem 0" }} className="fade-in">
      <div className="container" style={{ maxWidth: "900px" }}>
        
        {/* Editorial Hero Header */}
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <span className="editorial-title-badge">The Digital Library & Academy</span>
          <h1 style={{ fontSize: "4.25rem", lineHeight: "1.1", margin: "1rem 0 1.5rem 0", fontFamily: "var(--font-serif)", fontWeight: "400" }}>
            Learn something <br />
            <span style={{ fontStyle: "italic", color: "var(--primary)" }}>worth remembering.</span>
          </h1>
          <p style={{ fontSize: "1.25rem", color: "var(--text-muted)", margin: "0 auto 2.5rem auto", maxWidth: "650px", fontFamily: "var(--font-serif)", fontStyle: "italic" }}>
            A curated space for academic excellence, technical mastery, and lifelong digital cataloging.
          </p>

          <div style={{ display: "flex", gap: "1.25rem", justifyContent: "center", marginBottom: "5rem" }}>
            {user ? (
              user.role === "STUDENT" ? (
                <Link to="/courses" className="btn btn-primary">Open Catalog</Link>
              ) : user.role === "INSTRUCTOR" ? (
                <Link to="/instructor/dashboard" className="btn btn-primary">Go to Dashboard</Link>
              ) : (
                <Link to="/admin/dashboard" className="btn btn-primary">Admin Control Center</Link>
              )
            ) : (
              <>
                <Link to="/register" className="btn btn-primary">Register Account</Link>
                <Link to="/courses" className="btn btn-secondary">Browse Catalog</Link>
              </>
            )}
          </div>
        </div>

        {/* Bookshelf Illustration & Categories */}
        <div style={{ marginBottom: "6rem" }}>
          <h3 style={{ textAlign: "center", fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "1.8rem", marginBottom: "2.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
            Select Volume Categories
          </h3>
          
          {/* Animated Category Book Covers Grid */}
          <div className="grid grid-cols-3" style={{ gap: "2.5rem" }}>
            <Link to="/courses?category=Computer+Science" style={{ textDecoration: "none" }} className="book-card">
              <div className="book-cover" style={{ borderLeftColor: "#1e3a8a", minHeight: "220px" }}>
                <span className="book-cover-tag">Volume I</span>
                <span className="book-cover-title" style={{ fontSize: "1.25rem" }}>Computer Science</span>
                <span className="book-cover-author">LMS Archive</span>
              </div>
            </Link>
            <Link to="/courses?category=Information+Technology" style={{ textDecoration: "none" }} className="book-card">
              <div className="book-cover" style={{ borderLeftColor: "#047857", minHeight: "220px" }}>
                <span className="book-cover-tag">Volume II</span>
                <span className="book-cover-title" style={{ fontSize: "1.25rem" }}>Information Technology</span>
                <span className="book-cover-author">LMS Archive</span>
              </div>
            </Link>
            <Link to="/courses?category=Business+%26+Finance" style={{ textDecoration: "none" }} className="book-card">
              <div className="book-cover" style={{ borderLeftColor: "#b45309", minHeight: "220px" }}>
                <span className="book-cover-tag">Volume III</span>
                <span className="book-cover-title" style={{ fontSize: "1.25rem" }}>Business & Finance</span>
                <span className="book-cover-author">LMS Archive</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Library Stats Section */}
        <div className="grid grid-cols-3" style={{ gap: "2rem", borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)", padding: "3rem 0", marginBottom: "6rem" }}>
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: "3rem", fontFamily: "var(--font-serif)", color: "var(--primary)" }}>25k+</span>
            <h4 style={{ fontFamily: "var(--font-sans)", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>Enrolled Scholars</h4>
          </div>
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: "3rem", fontFamily: "var(--font-serif)", color: "var(--primary)" }}>120+</span>
            <h4 style={{ fontFamily: "var(--font-sans)", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>Academic Authors</h4>
          </div>
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: "3rem", fontFamily: "var(--font-serif)", color: "var(--primary)" }}>450+</span>
            <h4 style={{ fontFamily: "var(--font-sans)", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>Indexed Volumes</h4>
          </div>
        </div>

        {/* Academic Infrastructure Feature Cards */}
        <div style={{ textAlign: "left" }}>
          <h2 style={{ textAlign: "center", marginBottom: "3.5rem", fontFamily: "var(--font-serif)", fontStyle: "italic" }}>Academic Infrastructure</h2>
          <div className="grid grid-cols-3" style={{ gap: "2.5rem" }}>
            <div className="reading-card">
              <div className="bookmark-accent"></div>
              <h4 style={{ fontSize: "1.25rem", marginBottom: "0.75rem", fontFamily: "var(--font-serif)", fontWeight: "600" }}>Distributed Architecture</h4>
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", margin: 0 }}>
                Powered by a robust Spring Cloud configuration. Dynamic service registry with Eureka Server and decoupled feasibility micro-routing via API Gateway.
              </p>
            </div>
            <div className="reading-card">
              <div className="bookmark-accent" style={{ backgroundColor: "var(--secondary)" }}></div>
              <h4 style={{ fontSize: "1.25rem", marginBottom: "0.75rem", fontFamily: "var(--font-serif)", fontWeight: "600" }}>Stateless Cryptography</h4>
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", margin: 0 }}>
                State-of-the-art security with cryptographic signature verification of JSON Web Tokens, decoupling service nodes from authentication database hops.
              </p>
            </div>
            <div className="reading-card">
              <div className="bookmark-accent" style={{ backgroundColor: "var(--accent)" }}></div>
              <h4 style={{ fontSize: "1.25rem", marginBottom: "0.75rem", fontFamily: "var(--font-serif)", fontWeight: "600" }}>Catalog Lifecycle</h4>
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", margin: 0 }}>
                Course drafts are composed offline, reviewed by domain instructors, and published to the active public catalog dynamically via decoupled feeds.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Home;
