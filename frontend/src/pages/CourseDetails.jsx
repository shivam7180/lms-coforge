import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import courseService from "../services/courseService";
import enrollmentService from "../services/enrollmentService";
import authService from "../services/authService";

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrollmentStatus, setEnrollmentStatus] = useState(null); // null, 'ACTIVE', 'CANCELLED'
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState("");

  // Simulated Razorpay Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card"); // 'card', 'upi', 'netbanking'
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Form states
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardHolder, setCardHolder] = useState(user ? user.fullName : "");
  const [upiId, setUpiId] = useState("");
  const [selectedBank, setSelectedBank] = useState("");

  useEffect(() => {
    const fetchCourseAndEnrollments = async () => {
      try {
        const courseData = await courseService.getCourseById(id);
        setCourse(courseData);

        if (user && user.role === "STUDENT") {
          const studentEnrollments = await enrollmentService.getEnrollmentsByStudent(user.userId);
          const currentEnrollment = studentEnrollments.find((e) => e.courseId === parseInt(id));
          if (currentEnrollment) {
            setEnrollmentStatus(currentEnrollment.status);
          }
        }
        setLoading(false);
      } catch (err) {
        console.error("Error loading course details", err);
        setError("Failed to load course details. It may not exist.");
        setLoading(false);
      }
    };
    fetchCourseAndEnrollments();
  }, [id, user]);

  const executeEnrollment = async () => {
    setEnrolling(true);
    setError("");

    try {
      await enrollmentService.createEnrollment(parseInt(id));
      setEnrollmentStatus("ACTIVE");
      setEnrolling(false);
      navigate("/student/dashboard?msg=enrolled");
    } catch (err) {
      setEnrolling(false);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Enrollment registration failed. Please try again later.");
      }
    }
  };

  const handleEnrollClick = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.role !== "STUDENT") {
      setError("Only students can enroll in courses.");
      return;
    }
    // Open our high-fidelity Razorpay simulator modal
    setShowPaymentModal(true);
    setPaymentSuccess(false);
    setProcessingPayment(false);
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    setProcessingPayment(true);

    // Simulate payment transaction validation steps
    setTimeout(() => {
      setProcessingPayment(false);
      setPaymentSuccess(true);
      
      // Delay enrollment trigger to show success checkmark screen
      setTimeout(() => {
        setShowPaymentModal(false);
        executeEnrollment();
      }, 1500);
    }, 2000);
  };

  const getSpineColor = (category) => {
    switch (category) {
      case "Computer Science":
        return "#1c3d5a";
      case "Information Technology":
        return "#2e623c";
      case "Business & Finance":
        return "#b45309";
      case "Design & Art":
        return "#8c1d40";
      default:
        return "#6b6050";
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: "4rem 0" }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="container" style={{ padding: "4rem 0" }}>
        <div className="reading-card text-center" style={{ maxWidth: "600px", margin: "0 auto" }}>
          <h2 style={{ color: "var(--danger)" }}>Error</h2>
          <p>{error}</p>
          <Link to="/courses" className="btn btn-secondary mt-4">Back to Courses</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "4rem 0" }} className="fade-in">
      <div className="container" style={{ maxWidth: "1000px" }}>
        <Link to="/courses" style={{ color: "var(--text-muted)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.5rem", marginBottom: "2.5rem", fontWeight: "600", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          &larr; Return to Library Index
        </Link>

        {error && (
          <div style={{ backgroundColor: "rgba(185, 28, 28, 0.12)", color: "var(--danger)", padding: "0.75rem 1.25rem", borderRadius: "var(--radius-sm)", fontSize: "0.9rem", marginBottom: "1.5rem", border: "1px solid rgba(185, 28, 28, 0.3)" }}>
            {error}
          </div>
        )}

        {/* Editorial Split Grid Layout */}
        <div style={{ display: "flex", gap: "3.5rem", flexWrap: "wrap" }}>
          
          {/* Left Column: Publication Details */}
          <div style={{ flex: "2 1 550px" }}>
            <span className="editorial-title-badge">{course.category}</span>
            <h1 style={{ fontSize: "3.5rem", marginBottom: "1rem", lineHeight: "1.15", fontWeight: "700" }}>
              {course.title}
            </h1>
            
            <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "1.5rem", marginBottom: "2rem" }}>
              <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
                Author / Instructor ID: <strong style={{ color: "var(--text-main)" }}>#{course.instructorId}</strong>
              </span>
              <span style={{ color: "var(--border-color)" }}>|</span>
              <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
                Catalog Reference: <strong style={{ color: "var(--text-main)" }}>LMS-{course.id}</strong>
              </span>
            </div>

            <h3 style={{ fontSize: "1.8rem", marginBottom: "1rem" }}>Abstract Overview</h3>
            <p style={{ fontSize: "1.1rem", lineHeight: "1.8", color: "var(--text-main)", marginBottom: "3rem", textAlign: "justify" }}>
              {course.description}
            </p>

            {/* Structured Table of Contents (Syllabus) */}
            <div style={{ marginTop: "3.5rem" }}>
              <h3 style={{ fontSize: "1.8rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
                Table of Contents
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "1.3rem", color: "var(--primary)", width: "30px", fontWeight: "700" }}>01</span>
                  <div>
                    <h4 style={{ fontWeight: "700", fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Foundational Domain Concepts</h4>
                    <p style={{ fontSize: "0.85rem", margin: "0.25rem 0 0 0", color: "var(--text-muted)" }}>Core definitions, glossary definitions, and context of the learning platform.</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "1.3rem", color: "var(--primary)", width: "30px", fontWeight: "700" }}>02</span>
                  <div>
                    <h4 style={{ fontWeight: "700", fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Architecture & System Feasibility</h4>
                    <p style={{ fontSize: "0.85rem", margin: "0.25rem 0 0 0", color: "var(--text-muted)" }}>Deep-dive analysis of structure, modules validation, and schema layout.</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "1.3rem", color: "var(--primary)", width: "30px", fontWeight: "700" }}>03</span>
                  <div>
                    <h4 style={{ fontWeight: "700", fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Implementation & Practical Case Studies</h4>
                    <p style={{ fontSize: "0.85rem", margin: "0.25rem 0 0 0", color: "var(--text-muted)" }}>Hands-on tasks, review, and integration tests to verify code blocks.</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "1.3rem", color: "var(--primary)", width: "30px", fontWeight: "700" }}>04</span>
                  <div>
                    <h4 style={{ fontWeight: "700", fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Summary Review & Archive Validation</h4>
                    <p style={{ fontSize: "0.85rem", margin: "0.25rem 0 0 0", color: "var(--text-muted)" }}>Graduation tasks and review of completed files in the digital shell.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Book Cover & Pricing Panel */}
          <div style={{ flex: "1 1 300px" }}>
            <div style={{ position: "sticky", top: "110px" }}>
              <div 
                className="book-cover" 
                style={{ 
                  borderLeftColor: getSpineColor(course.category),
                  minHeight: "350px",
                  pointerEvents: "none",
                  marginBottom: "2rem"
                }}
              >
                <div>
                  <span className="book-cover-tag">{course.category}</span>
                  <h3 className="book-cover-title" style={{ fontSize: "1.8rem" }}>{course.title}</h3>
                </div>
                <div>
                  <span className="book-cover-author">Reference Vol. #{course.id}</span>
                </div>
              </div>

              <div className="reading-card" style={{ padding: "1.5rem" }}>
                <span style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                  Tuition Value
                </span>
                <span style={{ fontSize: "2.2rem", fontWeight: "700", color: "var(--text-main)", display: "block", marginBottom: "1.5rem" }}>
                  ₹{course.price.toFixed(2)}
                </span>

                {/* Enrollment Action Buttons */}
                {!user ? (
                  <Link to="/login" className="btn btn-primary" style={{ width: "100%" }}>Sign In to Enroll</Link>
                ) : user.role === "STUDENT" ? (
                  enrollmentStatus === "ACTIVE" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      <span className="badge badge-active" style={{ justifyContent: "center", padding: "0.5rem 1rem", fontSize: "0.8rem" }}>
                        Currently Registered
                      </span>
                      <Link to="/student/dashboard" className="btn btn-secondary" style={{ width: "100%" }}>Open Personal Shelf</Link>
                    </div>
                  ) : enrollmentStatus === "CANCELLED" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      <span className="badge badge-cancelled" style={{ justifyContent: "center", padding: "0.5rem 1rem", fontSize: "0.8rem" }}>
                        Enrollment Cancelled
                      </span>
                      <button onClick={handleEnrollClick} className="btn btn-primary" style={{ width: "100%" }} disabled={enrolling}>
                        {enrolling ? "Registering..." : "Re-enroll Vol."}
                      </button>
                    </div>
                  ) : (
                    <button onClick={handleEnrollClick} className="btn btn-primary" style={{ width: "100%" }} disabled={enrolling}>
                      {enrolling ? "Registering..." : "Enroll Now"}
                    </button>
                  )
                ) : user.role === "INSTRUCTOR" ? (
                  <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", display: "block", textAlign: "center", fontWeight: "600" }}>
                    Instructors cannot register in volumes.
                  </span>
                ) : (
                  <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", display: "block", textAlign: "center", fontWeight: "600" }}>
                    Administrators cannot register in volumes.
                  </span>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* High-Fidelity Razorpay Simulator Modal */}
      {showPaymentModal && (
        <div className="modal-overlay">
          <div 
            className="modal-content" 
            style={{ 
              maxWidth: "520px", 
              padding: 0, 
              overflow: "hidden", 
              border: "1px solid var(--border-color)", 
              backgroundColor: "#ffffff",
              color: "#2e303d",
              fontFamily: "var(--font-sans)"
            }}
          >
            {/* Header: Razorpay Styled branding */}
            <div style={{ backgroundColor: "#1c2237", padding: "1.5rem", color: "#ffffff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                {/* Simulated Blue Shield Logo */}
                <div style={{ width: "32px", height: "32px", borderRadius: "4px", backgroundColor: "#3399cc", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="#ffffff" style={{ width: "16px", height: "16px" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0110 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0114 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                  </svg>
                </div>
                <div>
                  <h4 style={{ margin: 0, fontWeight: "700", fontSize: "1.05rem", color: "#ffffff" }}>LMS Space</h4>
                  <span style={{ fontSize: "0.75rem", color: "#a5b4fc" }}>{course.title}</span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ display: "block", fontSize: "0.75rem", color: "#a5b4fc" }}>Amount Due</span>
                <span style={{ fontSize: "1.25rem", fontWeight: "700" }}>₹{course.price.toFixed(2)}</span>
              </div>
            </div>

            {/* Test Mode Warning Ribbon */}
            <div style={{ backgroundColor: "#fef3c7", borderBottom: "1px solid #fde68a", padding: "0.5rem 1.5rem", color: "#b45309", fontSize: "0.75rem", fontWeight: "600", display: "flex", justifyContent: "space-between" }}>
              <span>⚠️ RAZORPAY TEST MODE SIMULATION</span>
              <span>Key ID: rzp_test_active</span>
            </div>

            {/* Main Checkout Area */}
            {processingPayment ? (
              <div style={{ padding: "4rem 2rem", textAlign: "center" }}>
                <div className="spinner" style={{ borderColor: "#e2e8f0", borderTopColor: "#3399cc" }}></div>
                <h4 style={{ marginTop: "1.5rem", fontWeight: "700" }}>Authenticating with bank...</h4>
                <p style={{ fontSize: "0.85rem", color: "#64748b" }}>Please do not close this window or hit refresh.</p>
              </div>
            ) : paymentSuccess ? (
              <div style={{ padding: "4rem 2rem", textAlign: "center" }}>
                <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#d1fae5", border: "2px solid #34d399", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem auto" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="#059669" style={{ width: "32px", height: "32px" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <h3 style={{ color: "#065f46", fontWeight: "800", fontSize: "1.5rem", marginBottom: "0.5rem" }}>Payment Successful</h3>
                <p style={{ fontSize: "0.85rem", color: "#047857" }}>Tuition received. Directing to student shelf...</p>
              </div>
            ) : (
              <div style={{ display: "flex", minHeight: "300px" }}>
                {/* Method Selector Tabs (Left Sidebar) */}
                <div style={{ width: "170px", backgroundColor: "#f8fafc", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column" }}>
                  <button 
                    onClick={() => setPaymentMethod("card")} 
                    style={{ padding: "1.1rem 1.25rem", border: "none", borderLeft: paymentMethod === "card" ? "4px solid #3399cc" : "4px solid transparent", backgroundColor: paymentMethod === "card" ? "#ffffff" : "transparent", textAlign: "left", cursor: "pointer", fontWeight: "700", color: paymentMethod === "card" ? "#1e293b" : "#64748b", fontSize: "0.85rem" }}
                  >
                    💳 Card (Mock)
                  </button>
                  <button 
                    onClick={() => setPaymentMethod("upi")} 
                    style={{ padding: "1.1rem 1.25rem", border: "none", borderLeft: paymentMethod === "upi" ? "4px solid #3399cc" : "4px solid transparent", backgroundColor: paymentMethod === "upi" ? "#ffffff" : "transparent", textAlign: "left", cursor: "pointer", fontWeight: "700", color: paymentMethod === "upi" ? "#1e293b" : "#64748b", fontSize: "0.85rem" }}
                  >
                    📱 UPI / QR
                  </button>
                  <button 
                    onClick={() => setPaymentMethod("netbanking")} 
                    style={{ padding: "1.1rem 1.25rem", border: "none", borderLeft: paymentMethod === "netbanking" ? "4px solid #3399cc" : "4px solid transparent", backgroundColor: paymentMethod === "netbanking" ? "#ffffff" : "transparent", textAlign: "left", cursor: "pointer", fontWeight: "700", color: paymentMethod === "netbanking" ? "#1e293b" : "#64748b", fontSize: "0.85rem" }}
                  >
                    🏦 Netbanking
                  </button>
                </div>

                {/* Form Input Area (Right side) */}
                <div style={{ flex: 1, padding: "1.5rem 2rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <form onSubmit={handlePaymentSubmit} style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
                    
                    {/* CARD OPTION */}
                    {paymentMethod === "card" && (
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontWeight: "700", marginBottom: "1rem", fontSize: "0.95rem" }}>Pay via Card</h4>
                        <div className="form-group" style={{ marginBottom: "1rem" }}>
                          <label className="form-label" style={{ fontSize: "0.65rem", color: "#64748b" }}>Cardholder Name</label>
                          <input
                            type="text"
                            style={{ padding: "0.55rem 0.75rem", border: "1px solid #cbd5e1", borderRadius: "4px", width: "100%", color: "#1e293b", backgroundColor: "#ffffff" }}
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value)}
                            placeholder="Full Name"
                            required
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: "1rem" }}>
                          <label className="form-label" style={{ fontSize: "0.65rem", color: "#64748b" }}>Card Number</label>
                          <input
                            type="text"
                            style={{ padding: "0.55rem 0.75rem", border: "1px solid #cbd5e1", borderRadius: "4px", width: "100%", color: "#1e293b", backgroundColor: "#ffffff" }}
                            value={cardNumber}
                            onChange={(e) => {
                              let val = e.target.value.replace(/\D/g, "");
                              if (val.length > 16) val = val.slice(0, 16);
                              let formatted = val.match(/.{1,4}/g)?.join("-") || val;
                              setCardNumber(formatted);
                            }}
                            placeholder="4000-1234-5678-9010"
                            required
                          />
                        </div>
                        <div style={{ display: "flex", gap: "1rem" }}>
                          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: "0.65rem", color: "#64748b" }}>Expiry Date</label>
                            <input
                              type="text"
                              style={{ padding: "0.55rem 0.75rem", border: "1px solid #cbd5e1", borderRadius: "4px", width: "100%", color: "#1e293b", backgroundColor: "#ffffff" }}
                              value={cardExpiry}
                              onChange={(e) => {
                                let val = e.target.value.replace(/\D/g, "");
                                if (val.length > 4) val = val.slice(0, 4);
                                if (val.length > 2) val = val.slice(0, 2) + "/" + val.slice(2);
                                setCardExpiry(val);
                              }}
                              placeholder="MM/YY"
                              required
                            />
                          </div>
                          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: "0.65rem", color: "#64748b" }}>CVV</label>
                            <input
                              type="password"
                              maxLength="3"
                              style={{ padding: "0.55rem 0.75rem", border: "1px solid #cbd5e1", borderRadius: "4px", width: "100%", color: "#1e293b", backgroundColor: "#ffffff" }}
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                              placeholder="•••"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* UPI OPTION */}
                    {paymentMethod === "upi" && (
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <h4 style={{ fontWeight: "700", marginBottom: "0.75rem", fontSize: "0.95rem", width: "100%" }}>Pay via UPI</h4>
                        
                        {/* Mock QR code container */}
                        <div style={{ border: "1px solid #e2e8f0", padding: "0.5rem", borderRadius: "6px", backgroundColor: "#f8fafc", marginBottom: "1rem" }}>
                          <svg width="120" height="120" viewBox="0 0 100 100" style={{ display: "block" }}>
                            <rect width="100" height="100" fill="#ffffff" />
                            {/* Dummy QR modules */}
                            <rect x="5" y="5" width="25" height="25" fill="#1c2237" />
                            <rect x="10" y="10" width="15" height="15" fill="#ffffff" />
                            <rect x="70" y="5" width="25" height="25" fill="#1c2237" />
                            <rect x="75" y="10" width="15" height="15" fill="#ffffff" />
                            <rect x="5" y="70" width="25" height="25" fill="#1c2237" />
                            <rect x="10" y="75" width="15" height="15" fill="#ffffff" />
                            <rect x="40" y="40" width="20" height="20" fill="#1c2237" />
                            <rect x="45" y="45" width="10" height="10" fill="#ffffff" />
                            <rect x="75" y="75" width="20" height="20" fill="#1c2237" />
                            {/* Random blocks */}
                            <rect x="35" y="10" width="10" height="15" fill="#1c2237" />
                            <rect x="50" y="20" width="15" height="10" fill="#1c2237" />
                            <rect x="10" y="35" width="15" height="10" fill="#1c2237" />
                            <rect x="35" y="70" width="10" height="20" fill="#1c2237" />
                            <rect x="55" y="75" width="15" height="15" fill="#1c2237" />
                          </svg>
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "1rem" }}>Scan QR using PhonePe, GPay or Paytm</span>
                        
                        <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "0.75rem", width: "100%" }}>
                          <label className="form-label" style={{ fontSize: "0.65rem", color: "#64748b" }}>Or Enter Virtual Payment Address (VPA)</label>
                          <input
                            type="text"
                            style={{ padding: "0.55rem 0.75rem", border: "1px solid #cbd5e1", borderRadius: "4px", width: "100%", color: "#1e293b", backgroundColor: "#ffffff" }}
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            placeholder="username@okaxis"
                            required={paymentMethod === "upi"}
                          />
                        </div>
                      </div>
                    )}

                    {/* NETBANKING OPTION */}
                    {paymentMethod === "netbanking" && (
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontWeight: "700", marginBottom: "1rem", fontSize: "0.95rem" }}>Popular Banks</h4>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
                          {["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank"].map((bank) => (
                            <button
                              type="button"
                              key={bank}
                              onClick={() => setSelectedBank(bank)}
                              style={{ 
                                padding: "0.75rem 0.5rem", 
                                border: selectedBank === bank ? "2px solid #3399cc" : "1px solid #e2e8f0", 
                                backgroundColor: selectedBank === bank ? "#f0f9ff" : "#ffffff", 
                                color: "#1e293b", 
                                borderRadius: "6px", 
                                cursor: "pointer", 
                                fontSize: "0.8rem", 
                                fontWeight: "600",
                                textAlign: "center"
                              }}
                            >
                              {bank}
                            </button>
                          ))}
                        </div>
                        {selectedBank && (
                          <div style={{ marginTop: "1rem", fontSize: "0.8rem", color: "#047857", fontWeight: "600" }}>
                            Selected: {selectedBank}
                          </div>
                        )}
                        <input type="hidden" value={selectedBank} required={paymentMethod === "netbanking"} />
                      </div>
                    )}

                    {/* Footer Payment Triggers */}
                    <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
                      <button 
                        type="button" 
                        className="btn" 
                        style={{ flex: 1, backgroundColor: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", letterSpacing: 0, textTransform: "none", fontSize: "0.85rem", padding: "0.55rem" }} 
                        onClick={() => setShowPaymentModal(false)}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="btn" 
                        style={{ flex: 1, backgroundColor: "#3399cc", color: "#ffffff", border: "none", letterSpacing: 0, textTransform: "none", fontSize: "0.85rem", fontWeight: "700", padding: "0.55rem" }}
                      >
                        Pay ₹{course.price.toFixed(2)}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Footer Branding */}
            <div style={{ borderTop: "1px solid #f1f5f9", padding: "0.75rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f8fafc", fontSize: "0.65rem", color: "#94a3b8" }}>
              <span>Secure transaction encrypted via SSL</span>
              <span style={{ fontWeight: "700" }}>Secured by <span style={{ color: "#3399cc" }}>Razorpay</span></span>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetails;
