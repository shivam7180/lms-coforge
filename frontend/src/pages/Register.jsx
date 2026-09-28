import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import authService from "../services/authService";
import { validateRegisterForm } from "../utils/validation";

const MANDATORY_FIELDS = ["fullName", "email", "password", "role"];

const DEFAULT_PLACEHOLDERS = {
  fullName: "John Doe",
  email: "student@lms.com",
  password: "Choose a secure key",
  role: "Select scholastic objective *"
};

const Register = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({
    fullName: false,
    email: false,
    password: false,
    role: false
  });

  const isFieldEmpty = (name) => {
    switch (name) {
      case "fullName":
        return !fullName.trim();
      case "email":
        return !email.trim();
      case "password":
        return !password;
      case "role":
        return !role.trim();
      default:
        return false;
    }
  };

  const handleFieldFocus = (targetField) => {
    // Clear error on the currently focused field so user can input content
    if (fieldErrors[targetField]) {
      setFieldErrors((prev) => ({ ...prev, [targetField]: false }));
    }

    const targetIndex = MANDATORY_FIELDS.indexOf(targetField);
    const maxIndex = targetIndex === -1 ? MANDATORY_FIELDS.length : targetIndex;

    const newErrors = {};
    let changed = false;

    // Check all previous mandatory fields in sequential order:
    // Full Name -> Email Address -> Password -> Scholastic Objective
    for (let i = 0; i < maxIndex; i++) {
      const field = MANDATORY_FIELDS[i];
      if (isFieldEmpty(field)) {
        newErrors[field] = true;
        changed = true;
      }
    }

    if (changed) {
      setFieldErrors((prev) => ({ ...prev, ...newErrors }));
    }
  };

  const handleFieldBlur = (fieldName) => {
    if (isFieldEmpty(fieldName)) {
      setFieldErrors((prev) => ({ ...prev, [fieldName]: true }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Trigger visual field errors on all empty mandatory fields
    const emptyErrors = {};
    let hasEmpty = false;
    MANDATORY_FIELDS.forEach((f) => {
      if (isFieldEmpty(f)) {
        emptyErrors[f] = true;
        hasEmpty = true;
      }
    });
    if (hasEmpty) {
      setFieldErrors((prev) => ({ ...prev, ...emptyErrors }));
    }

    const validationErrors = validateRegisterForm(fullName, email, password, role);
    if (validationErrors.length > 0) {
      const mappedErrors = validationErrors.map((err) =>
        err === "Please enter this field first." ? "Please fill this content first." : err
      );
      setErrors(mappedErrors);
      return;
    }
    setErrors([]);
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
        setErrors([err.response.data.message]);
      } else {
        setErrors(["Registration failed. Email might already be in use."]);
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

          {errors.length > 0 && (
            <div style={{ backgroundColor: "rgba(185, 28, 28, 0.12)", color: "var(--danger)", padding: "0.75rem 1rem", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", marginBottom: "1.5rem", border: "1px solid rgba(185, 28, 28, 0.3)" }}>
              {errors.length === 1 ? (
                <div>{errors[0]}</div>
              ) : (
                <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
                  {errors.map((err, idx) => (
                    <li key={idx} style={{ marginTop: idx > 0 ? "0.25rem" : 0 }}>
                      {err}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate autoComplete="off" autoCapitalize="off" spellCheck="false">
            {/* Decoy fields to consume aggressive browser autofill */}
            <input type="text" name="chrome_decoy_user" style={{ display: "none" }} tabIndex="-1" autoComplete="off" />
            <input type="password" name="chrome_decoy_pwd" style={{ display: "none" }} tabIndex="-1" autoComplete="new-password" />

            <div className="form-group">
              <label className="form-label" htmlFor="fullName">Full Name *</label>
              <input
                type="text"
                id="fullName"
                name="reg_user_fullname"
                className={`form-input ${fieldErrors.fullName ? "input-error" : ""}`}
                placeholder={fieldErrors.fullName ? "Please fill this content first." : DEFAULT_PLACEHOLDERS.fullName}
                value={fullName}
                onFocus={() => handleFieldFocus("fullName")}
                onBlur={() => handleFieldBlur("fullName")}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (fieldErrors.fullName && e.target.value.trim()) {
                    setFieldErrors((prev) => ({ ...prev, fullName: false }));
                  }
                }}
                autoComplete="off"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="reg_user_email"
                className={`form-input ${fieldErrors.email ? "input-error" : ""}`}
                placeholder={fieldErrors.email ? "Please fill this content first." : DEFAULT_PLACEHOLDERS.email}
                value={email}
                onFocus={() => handleFieldFocus("email")}
                onBlur={() => handleFieldBlur("email")}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email && e.target.value.trim()) {
                    setFieldErrors((prev) => ({ ...prev, email: false }));
                  }
                }}
                autoComplete="off"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password * (min 6 chars)</label>
              <input
                type="password"
                id="password"
                name="reg_user_password"
                className={`form-input ${fieldErrors.password ? "input-error" : ""}`}
                placeholder={fieldErrors.password ? "Please fill this content first." : DEFAULT_PLACEHOLDERS.password}
                value={password}
                onFocus={() => handleFieldFocus("password")}
                onBlur={() => handleFieldBlur("password")}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password && e.target.value) {
                    setFieldErrors((prev) => ({ ...prev, password: false }));
                  }
                }}
                autoComplete="new-password"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="role">Scholastic Objective *</label>
              <select
                id="role"
                className={`form-input ${fieldErrors.role ? "input-error" : ""}`}
                style={{
                  backgroundColor: "var(--bg-primary)",
                  cursor: "pointer",
                  color: !role ? (fieldErrors.role ? "var(--danger)" : "var(--text-muted)") : "inherit"
                }}
                value={role}
                onFocus={() => handleFieldFocus("role")}
                onBlur={() => handleFieldBlur("role")}
                onChange={(e) => {
                  setRole(e.target.value);
                  if (fieldErrors.role && e.target.value.trim()) {
                    setFieldErrors((prev) => ({ ...prev, role: false }));
                  }
                }}
                required
              >
                <option value="" disabled hidden>
                  {fieldErrors.role ? "Please fill this content first." : DEFAULT_PLACEHOLDERS.role}
                </option>
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
                onFocus={() => handleFieldFocus("bio")}
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
        .input-error {
          border-color: var(--danger, #b91c1c) !important;
          background-color: rgba(185, 28, 28, 0.05) !important;
          box-shadow: 0 0 0 2px rgba(185, 28, 28, 0.2) !important;
        }
        .input-error::placeholder {
          color: var(--danger, #b91c1c) !important;
          font-weight: 500;
          opacity: 0.95;
        }
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
