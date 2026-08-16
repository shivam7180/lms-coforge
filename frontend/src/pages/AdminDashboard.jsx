import React, { useState, useEffect } from "react";
import userService from "../services/userService";
import courseService from "../services/courseService";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("users"); // 'users', 'courses'
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = async () => {
    try {
      const usersData = await userService.getAllUsers();
      const coursesData = await courseService.getAllCourses();
      setUsers(usersData);
      setCourses(coursesData);
      setLoading(false);
    } catch (err) {
      console.error("Error loading admin dashboard", err);
      setError("Failed to load administration data. Check your authorization permissions.");
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePublishCourse = async (id) => {
    try {
      setError("");
      setSuccess("");
      await courseService.publishCourse(id);
      setSuccess(`Course volume #${id} published successfully!`);
      loadData();
    } catch (err) {
      setError("Failed to publish course.");
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm(`Are you sure you want to delete course volume #${id}?`)) {
      return;
    }
    try {
      setError("");
      setSuccess("");
      await courseService.deleteCourse(id);
      setSuccess(`Course volume #${id} deleted successfully.`);
      loadData();
    } catch (err) {
      setError("Failed to delete course.");
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
    <div style={{ padding: "4rem 0" }} className="fade-in">
      <div className="container">
        
        {/* Admin Header */}
        <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "1.5rem", marginBottom: "3rem" }}>
          <span className="editorial-title-badge">Curator Panel</span>
          <h1 style={{ fontFamily: "var(--font-serif)", fontWeight: "400", margin: "0.5rem 0 0 0" }}>
            Administration <span style={{ fontStyle: "italic" }}>Console</span>
          </h1>
          <p style={{ color: "var(--text-muted)", margin: "0.5rem 0 0 0" }}>
            Manage platform users registry index, cataloged book volumes, and curriculum feeds.
          </p>
        </div>

        {error && (
          <div style={{ backgroundColor: "rgba(185, 28, 28, 0.12)", color: "var(--danger)", padding: "0.75rem 1.25rem", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", marginBottom: "1.5rem", border: "1px solid rgba(185, 28, 28, 0.3)" }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ backgroundColor: "rgba(46, 98, 60, 0.12)", color: "var(--success)", padding: "0.75rem 1.25rem", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", marginBottom: "1.5rem", border: "1px solid rgba(46, 98, 60, 0.3)" }}>
            {success}
          </div>
        )}

        {/* Tab Controls */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
          <button
            onClick={() => setActiveTab("users")}
            className={`btn ${activeTab === "users" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "0.55rem 1.25rem", fontSize: "0.8rem" }}
          >
            Scholars Registry ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("courses")}
            className={`btn ${activeTab === "courses" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "0.55rem 1.25rem", fontSize: "0.8rem" }}
          >
            Library Catalogue ({courses.length})
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="reading-card" style={{ padding: "2.5rem" }}>
            <div className="bookmark-accent" style={{ height: "40px" }}></div>
            <h3 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "1.65rem", marginBottom: "0.5rem" }}>Scholars & Authors Registry</h3>
            <p style={{ marginBottom: "2rem" }}>Active platform accounts list with authorization levels and system access status.</p>

            <div className="table-wrapper">
              <table className="editorial-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Full Name</th>
                    <th>Email Address</th>
                    <th>Role</th>
                    <th>Biography Notes</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: "700" }}>#{u.id}</td>
                      <td>{u.fullName}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`badge badge-${u.role.toLowerCase()}`}>{u.role}</span>
                      </td>
                      <td style={{ maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontStyle: "italic" }}>
                        {u.bio || "No description recorded."}
                      </td>
                      <td>
                        <span className="badge badge-active">{u.active ? "Authorized" : "Suspended"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === "courses" && (
          <div className="reading-card" style={{ padding: "2.5rem" }}>
            <div className="bookmark-accent" style={{ height: "40px", backgroundColor: "var(--secondary)" }}></div>
            <h3 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "1.65rem", marginBottom: "0.5rem" }}>Index Catalogue</h3>
            <p style={{ marginBottom: "2rem" }}>All draft and published course volumes stored in the distributed database.</p>

            <div className="table-wrapper">
              <table className="editorial-table">
                <thead>
                  <tr>
                    <th>Ref ID</th>
                    <th>Volume Title</th>
                    <th>Category</th>
                    <th>Instructor ID</th>
                    <th>Tuition Price</th>
                    <th>Registry State</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: "700" }}>LMS-{c.id}</td>
                      <td style={{ fontWeight: "600" }}>{c.title}</td>
                      <td>{c.category}</td>
                      <td>#{c.instructorId}</td>
                      <td>₹{c.price.toFixed(2)}</td>
                      <td>
                        <span className={`badge ${c.published ? 'badge-active' : 'badge-cancelled'}`}>
                          {c.published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          {!c.published && (
                            <button onClick={() => handlePublishCourse(c.id)} className="btn btn-success btn-sm" style={{ padding: "0.35rem 0.75rem" }}>
                              Publish
                            </button>
                          )}
                          <button onClick={() => handleDeleteCourse(c.id)} className="btn btn-danger btn-sm" style={{ padding: "0.35rem 0.75rem" }}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
