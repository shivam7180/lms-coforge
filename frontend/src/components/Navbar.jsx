import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import authService from "../services/authService";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  const isActive = (path) => {
    return location.pathname === path ? "nav-link active" : "nav-link";
  };

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="brand-logo" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            style={{ width: "26px", height: "26px" }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
            />
          </svg>
          <span style={{ fontFamily: "var(--font-serif)", fontWeight: "600", fontSize: "1.75rem", fontStyle: "italic", letterSpacing: "-0.01em" }}>
            LMS Space
          </span>
        </Link>

        <ul className="nav-links">
          {/* Public links */}
          <li>
            <Link to="/" className={isActive("/")}>
              Home
            </Link>
          </li>

          {/* Guest only links */}
          {!user && (
            <>
              <li>
                <Link to="/courses" className={isActive("/courses")}>
                  Courses
                </Link>
              </li>
              <li>
                <Link to="/login" className="btn btn-secondary btn-sm">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Register
                </Link>
              </li>
            </>
          )}

          {/* Student only links */}
          {user && user.role === "STUDENT" && (
            <>
              <li>
                <Link to="/courses" className={isActive("/courses")}>
                  Explore Courses
                </Link>
              </li>
              <li>
                <Link to="/student/dashboard" className={isActive("/student/dashboard")}>
                  My Shelf
                </Link>
              </li>
            </>
          )}

          {/* Instructor only links */}
          {user && user.role === "INSTRUCTOR" && (
            <>
              <li>
                <Link to="/instructor/dashboard" className={isActive("/instructor/dashboard")}>
                  Instructor Board
                </Link>
              </li>
              <li>
                <Link to="/instructor/create-course" className={isActive("/instructor/create-course")}>
                  Create Course
                </Link>
              </li>
            </>
          )}

          {/* Admin only links */}
          {user && user.role === "ADMIN" && (
            <>
              <li>
                <Link to="/admin/dashboard" className={isActive("/admin/dashboard")}>
                  Admin Panel
                </Link>
              </li>
            </>
          )}

          {/* User profile & Logout */}
          {user && (
            <>
              <li>
                <Link to="/profile" className={isActive("/profile")}>
                  Profile ({user.fullName.split(" ")[0]})
                </Link>
              </li>
              <li>
                <button onClick={handleLogout} className="btn btn-secondary btn-sm" style={{ padding: "0.4rem 0.85rem", fontSize: "0.75rem" }}>
                  Logout
                </button>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
