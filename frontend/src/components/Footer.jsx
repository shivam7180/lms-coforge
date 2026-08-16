import React from "react";

const Footer = () => {
  return (
    <footer
      style={{
        marginTop: "auto",
        padding: "2.5rem 0",
        borderTop: "1px solid var(--border-color)",
        backgroundColor: "var(--bg-secondary)",
        textAlign: "center",
        color: "var(--text-muted)",
        fontSize: "0.8rem",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        fontWeight: "600",
        fontFamily: "var(--font-sans)"
      }}
    >
      <div className="container">
        <p>&copy; {new Date().getFullYear()} LMS Space &middot; The Academic Archive &middot; Spring Cloud Architecture</p>
      </div>
    </footer>
  );
};

export default Footer;
