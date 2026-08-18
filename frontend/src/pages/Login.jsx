import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import authService from "../services/authService";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || "/";
  const params = new URLSearchParams(location.search);
  const sessionExpired = params.get("message") === "session_expired";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const user = await authService.login(email, password);
      setLoading(false);
      if (from !== "/") {
        navigate(from, { replace: true });
      } else {
        if (user.role === "STUDENT") {
          navigate("/student/dashboard");
        } else if (user.role === "INSTRUCTOR") {
          navigate("/instructor/dashboard");
        } else if (user.role === "ADMIN") {
          navigate("/admin/dashboard");
        } else {
          navigate("/");
        }
      }
    } catch (err) {
      setLoading(false);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Invalid email or password. Please try again.");
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
        {/* Left Side: Editorial cover illustration block */}
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
          <div className="bookmark-accent" style={{ right: "3rem", height: "50px" }}></div>
          <div>
            <span className="editorial-title-badge">Library Entry</span>
            <h2 style={{ fontSize: "2.8rem", marginTop: "1rem", fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: "400" }}>
              "Reading is to the mind what exercise is to the body."
            </h2>
            <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.25rem", fontStyle: "italic", marginTop: "1rem" }}>
              &mdash; Joseph Addison
            </p>
          </div>
          <div>
            <h4 style={{ fontFamily: "var(--font-sans)", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.1em", fontWeight: "700" }}>
              Indexed volumes &middot; LMS Space
            </h4>
          </div>
        </div>

        {/* Right Side: Form */}
        <div style={{ flex: "1 1 50%", padding: "4rem 3.5rem", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "2.25rem", marginBottom: "0.5rem" }}>Welcome Back</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: "2rem" }}>
            Provide your academic credentials to enter the library shelves.
          </p>

          {sessionExpired && (
            <div style={{ backgroundColor: "rgba(202, 138, 4, 0.12)", color: "var(--warning)", padding: "0.75rem 1rem", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", marginBottom: "1.5rem", border: "1px solid rgba(202, 138, 4, 0.3)" }}>
              Your session has expired. Please authenticate again.
            </div>
          )}

          {error && (
            <div style={{ backgroundColor: "rgba(185, 28, 28, 0.12)", color: "var(--danger)", padding: "0.75rem 1rem", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", marginBottom: "1.5rem", border: "1px solid rgba(185, 28, 28, 0.3)" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off" autoCapitalize="off" spellCheck="false">
            {/* Decoy fields to consume aggressive browser autofill */}
            <input type="text" name="chrome_login_decoy_user" style={{ display: "none" }} tabIndex="-1" autoComplete="off" />
            <input type="password" name="chrome_login_decoy_pwd" style={{ display: "none" }} tabIndex="-1" autoComplete="new-password" />

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email / Register</label>
              <input
                type="email"
                id="email"
                name="user_auth_email"
                className="form-input"
                placeholder="email@lms.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: "2rem" }}>
              <label className="form-label" htmlFor="password">Passphrase</label>
              <input
                type="password"
                id="password"
                name="user_auth_passcode"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "0.85rem 1.5rem" }} disabled={loading}>
              {loading ? "Verifying Archive..." : "Open Library"}
            </button>
          </form>

          <p style={{ marginTop: "2rem", fontSize: "0.85rem", textAlign: "center", color: "var(--text-muted)" }}>
            New to the library?{" "}
            <Link to="/register" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: "600", borderBottom: "1px solid var(--primary)" }}>
              Create an account
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

export default Login;
