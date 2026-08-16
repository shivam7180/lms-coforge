import React, { useState, useEffect } from "react";
import userService from "../services/userService";
import authService from "../services/authService";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await userService.getProfile();
        setProfile(data);
        setLoading(false);
      } catch (err) {
        console.error("Error loading profile", err);
        setError("Could not load profile. Please make sure you are logged in.");
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ padding: "4rem 0" }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ padding: "4rem 0" }}>
        <div className="reading-card text-center" style={{ maxWidth: "600px", margin: "0 auto", color: "var(--danger)" }}>
          <h3 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}>Registration Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "4rem 0" }} className="fade-in">
      <div className="container" style={{ maxWidth: "650px" }}>
        
        {/* Editorial Library card styling */}
        <div className="reading-card" style={{ padding: "3rem", position: "relative" }}>
          <div className="bookmark-accent"></div>
          
          <div style={{ display: "flex", gap: "2rem", alignItems: "center", marginBottom: "2.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "1.5rem" }}>
            <div
              style={{
                width: "70px",
                height: "70px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.8rem",
                fontWeight: "700",
                color: "var(--bg-primary)",
                fontFamily: "var(--font-serif)"
              }}
            >
              {profile.fullName.charAt(0).toUpperCase()}
            </div>

            <div>
              <h2 style={{ marginBottom: "0.25rem", fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: "400" }}>{profile.fullName}</h2>
              <span className={`badge badge-${profile.role.toLowerCase()}`}>{profile.role}</span>
            </div>
          </div>

          <h3 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "1.6rem", marginBottom: "1.5rem" }}>Scholastic File Card</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              <span className="form-label" style={{ fontSize: "0.7rem", letterSpacing: "0.08em" }}>Academic Identifier</span>
              <span style={{ fontSize: "1.05rem", fontFamily: "var(--font-serif)", fontStyle: "italic" }}>Scholar-#{profile.id}</span>
            </div>

            <div>
              <span className="form-label" style={{ fontSize: "0.7rem", letterSpacing: "0.08em" }}>Contact Destination</span>
              <span style={{ fontSize: "1.05rem", color: "var(--text-main)", fontWeight: "500" }}>{profile.email}</span>
            </div>

            <div>
              <span className="form-label" style={{ fontSize: "0.7rem", letterSpacing: "0.08em" }}>Bio-Sketch / Scholar Notes</span>
              <p style={{ fontSize: "0.95rem", color: "var(--text-main)", margin: 0, fontStyle: "italic", lineHeight: "1.6" }}>
                {profile.bio || "No biographical notes recorded in archive."}
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem", marginTop: "1rem" }}>
              <div>
                <span className="form-label" style={{ fontSize: "0.7rem", letterSpacing: "0.08em" }}>Registry Status</span>
                <span className="badge badge-active">{profile.active ? "Authorized / Active" : "Suspended"}</span>
              </div>
              <div>
                <span className="form-label" style={{ fontSize: "0.7rem", letterSpacing: "0.08em" }}>Matriculation Date</span>
                <span style={{ fontSize: "0.95rem", fontWeight: "600" }}>
                  {new Date(profile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
