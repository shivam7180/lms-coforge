import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import enrollmentService from "../services/enrollmentService";
import courseService from "../services/courseService";
import authService from "../services/authService";

const QUIZZES_DATA = {
  "Computer Science": [
    {
      question: "Which annotation is used to declare a Spring Boot microservice application?",
      options: ["@SpringBootApplication", "@EnableDiscoveryClient", "@RestController", "@Service"],
      answer: 0
    },
    {
      question: "What is Eureka Server used for in Spring Cloud?",
      options: ["API Routing", "Service Discovery", "Database Mapping", "OAuth Authorization"],
      answer: 1
    },
    {
      question: "How does OpenFeign communicate between microservices?",
      options: ["Direct Database Queries", "Declarative HTTP REST Calls", "Kafka Messages", "FTP File Sharing"],
      answer: 1
    },
    {
      question: "What is the purpose of Spring Cloud API Gateway?",
      options: ["Storing session states", "Acting as a single entry point proxy for clients", "Injecting Hibernate dependencies", "Executing SQL queries"],
      answer: 1
    },
    {
      question: "Which component handles stateless token validation in Spring Security?",
      options: ["Eureka Client", "JSON Web Token (JWT) Filter", "Lombok annotations", "Hibernate SessionFactory"],
      answer: 1
    }
  ],
  "Information Technology": [
    {
      question: "Which command is used to view running Docker containers?",
      options: ["docker images", "docker run", "docker ps", "docker system prune"],
      answer: 2
    },
    {
      question: "In MySQL, which unique constraint validates student-course integrity in enrollment tables?",
      options: ["Foreign Key constraint only", "Primary Key identity constraint", "Unique Key constraint on combination of columns", "Index columns only"],
      answer: 2
    },
    {
      question: "What port does Eureka server register on by default?",
      options: ["8080", "3306", "8761", "8081"],
      answer: 2
    },
    {
      question: "What is the default port of the API Gateway in this microservice workspace?",
      options: ["8083", "8080", "5173", "8761"],
      answer: 1
    },
    {
      question: "Which protocol is utilized by microservice feign clients?",
      options: ["FTP", "SMTP", "HTTP", "SSH"],
      answer: 2
    }
  ],
  "Business & Finance": [
    {
      question: "What is the primary indicator of capital asset productivity?",
      options: ["Debt-to-Equity Ratio", "Return on Investment (ROI)", "Gross Margins", "Operating Cash flow"],
      answer: 1
    },
    {
      question: "Which document tracks financial revenues and expenses over a period?",
      options: ["Balance Sheet", "Income Statement", "Ledger Registry", "Capital Budget Plan"],
      answer: 1
    },
    {
      question: "What is compound interest?",
      options: ["Interest calculated only on principal", "Interest calculated on principal plus accumulated interest", "Fixed service charge fee", "Tax-deductible asset yield"],
      answer: 1
    },
    {
      question: "Which concept refers to the difficulty of converting an asset to cash quickly?",
      options: ["Depreciation", "Liquidity Risk", "Inflation", "Asset Valuation"],
      answer: 1
    },
    {
      question: "What is the core target of micro-finance models?",
      options: ["Large industrial corporations", "Low-income individuals and entrepreneurs", "Commercial investment banks", "Government bonds index"],
      answer: 1
    }
  ],
  "Design & Art": [
    {
      question: "What does UI/UX hierarchy ensure for users?",
      options: ["Color gradients only", "Optimal reading flow and scannable interface", "High loading speed", "CSS class counts reduction"],
      answer: 1
    },
    {
      question: "Which layout styling system uses rows and columns dynamically?",
      options: ["CSS Grid", "Absolute Positioning", "Block margins", "Floats"],
      answer: 0
    },
    {
      question: "What is the standard focus indicator of academic form inputs in our design system?",
      options: ["A thick red outline", "An antique terracotta border highlight with subtle box shadow", "Taillight gradients", "Stark blue borders"],
      answer: 1
    },
    {
      question: "Which font style is generally preferred for large clean headers in a standard modern LMS?",
      options: ["Comic Sans", "Serrated monospace", "Plus Jakarta Sans / sans-serif", "Times New Roman"],
      answer: 2
    },
    {
      question: "What does 'negative space' refer to in visual layouts?",
      options: ["Errors on the page", "Empty margins that improve visual structure", "Dark mode overlays", "Broken image icons"],
      answer: 1
    }
  ],
  "General": [
    {
      question: "What is the main advantage of online digital libraries?",
      options: ["Unlimited storage space", "Instant access to archives anytime anywhere", "Reduced course price only", "Animated interfaces"],
      answer: 1
    },
    {
      question: "Which microservice acts as the authentication authority in our LMS architecture?",
      options: ["Eureka Server", "User Service", "Course Service", "Enrollment Service"],
      answer: 1
    },
    {
      question: "How do students confirm course completion in this platform?",
      options: ["By sending emails", "By passing the online assessment quiz to reach 100% progress", "By logging out and back in", "By modifying profiles"],
      answer: 1
    },
    {
      question: "What is the purpose of course syllabus abstracts?",
      options: ["Showing tuition price only", "Brief structural description of book chapters and topics", "Checking user login state", "Adding mock signatures"],
      answer: 1
    },
    {
      question: "What is Eureka client registration?",
      options: ["Student signup page", "Microservices announcing their status and endpoints to Eureka Server", "Setting database passwords", "Connecting to Razorpay API"],
      answer: 1
    }
  ]
};

const StudentDashboard = () => {
  const user = authService.getCurrentUser();
  const [enrollments, setEnrollments] = useState([]);
  const [coursesMap, setCoursesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [progressInput, setProgressInput] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Quiz States
  const [activeQuizEnrollment, setActiveQuizEnrollment] = useState(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizSaving, setQuizSaving] = useState(false);

  // Certificate State
  const [activeCertificate, setActiveCertificate] = useState(null);

  const loadData = async () => {
    try {
      const enrollData = await enrollmentService.getEnrollmentsByStudent(user.userId);
      const coursesData = await courseService.getPublishedCourses();
      
      const cmap = {};
      coursesData.forEach((c) => {
        cmap[c.id] = c;
      });

      setEnrollments(enrollData);
      setCoursesMap(cmap);
      setLoading(false);
    } catch (err) {
      console.error("Error loading dashboard data", err);
      setError("Failed to load library shelf data.");
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateProgress = async (id, overridePercentage = null) => {
    const percentage = overridePercentage !== null ? overridePercentage : parseFloat(progressInput);
    if (overridePercentage === null && (isNaN(percentage) || percentage < 0 || percentage > 100)) {
      setError("Please enter a valid percentage between 0 and 100.");
      return;
    }

    try {
      setError("");
      setSuccess("");
      await enrollmentService.updateProgress(id, percentage);
      setSuccess("Reading progress updated successfully!");
      setUpdatingId(null);
      setProgressInput("");
      loadData();
    } catch (err) {
      setError("Failed to update progress.");
    }
  };

  const handleCancelEnrollment = async (id) => {
    if (!window.confirm("Are you sure you want to cancel registration for this volume?")) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      await enrollmentService.cancelEnrollment(id);
      setSuccess("Volume registration returned to archive.");
      loadData();
    } catch (err) {
      setError("Failed to cancel enrollment.");
    }
  };

  // Quiz submission callback
  const handleLaunchQuiz = (enrollment) => {
    setActiveQuizEnrollment(enrollment);
    setCurrentQuestionIdx(0);
    setSelectedAnswers({});
    setQuizFinished(false);
    setQuizScore(0);
  };

  const handleSelectAnswer = (optionIdx) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestionIdx]: optionIdx
    });
  };

  const handleNextQuestion = (questionsList) => {
    if (currentQuestionIdx < questionsList.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    } else {
      // Calculate score
      let score = 0;
      questionsList.forEach((q, idx) => {
        if (selectedAnswers[idx] === q.answer) {
          score += 1;
        }
      });
      setQuizScore(score);
      setQuizFinished(true);
    }
  };

  const handleSaveQuizPassed = async () => {
    if (!activeQuizEnrollment) return;
    setQuizSaving(true);
    try {
      // Update progress in JPA database to 100% upon passing the quiz
      await enrollmentService.updateProgress(activeQuizEnrollment.id, 100);
      setSuccess("Assessment passed! Certificate unlocked.");
      setActiveQuizEnrollment(null);
      setQuizFinished(false);
      loadData();
    } catch (err) {
      setError("Failed to save assessment progress.");
    } finally {
      setQuizSaving(false);
    }
  };

  const activeEnrollments = enrollments.filter(e => e.status === "ACTIVE");
  const inactiveEnrollments = enrollments.filter(e => e.status !== "ACTIVE");

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

  const getQuizQuestions = () => {
    if (!activeQuizEnrollment) return [];
    const course = coursesMap[activeQuizEnrollment.courseId];
    if (!course) return QUIZZES_DATA["General"];
    return QUIZZES_DATA[course.category] || QUIZZES_DATA["General"];
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
        
        {/* Scholar Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid var(--border-color)", paddingBottom: "1.5rem", marginBottom: "3rem" }}>
          <div>
            <span className="editorial-title-badge">Personal Shell</span>
            <h1 style={{ fontWeight: "700", margin: "0.5rem 0 0 0" }}>
              My Learning Shelf
            </h1>
          </div>
          <div style={{ fontStyle: "italic", color: "var(--text-muted)", fontSize: "1.1rem" }}>
            Total Volumes: {enrollments.length} &middot; Active: {activeEnrollments.length}
          </div>
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

        {/* Section 1: Active Bookshelf Grid */}
        <h3 className="bookshelf-title" style={{ fontSize: "1.75rem" }}>
          <span>Active Volumes</span>
          <Link to="/courses" style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--primary)", textDecoration: "none", fontWeight: "700" }}>
            + Request New Volume
          </Link>
        </h3>

        {activeEnrollments.length === 0 ? (
          <div className="reading-card text-center" style={{ padding: "4rem 2rem", marginBottom: "4rem" }}>
            <h3 style={{ fontStyle: "italic" }}>Your Active Bookshelf is Empty</h3>
            <p style={{ marginBottom: "1.5rem" }}>No text files have been checked out yet.</p>
            <Link to="/courses" className="btn btn-primary btn-sm">Explore Catalog</Link>
          </div>
        ) : (
          <div className="bookshelf-grid">
            {activeEnrollments.map((enroll) => {
              const course = coursesMap[enroll.courseId] || {
                title: `Course #${enroll.courseId}`,
                category: "General Volume",
                description: "Loading summary info...",
              };

              const hasFinishedCourse = enroll.progressPercentage >= 100;

              return (
                <div key={enroll.id} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  
                  {/* Rendering Book cover as card */}
                  <Link to={`/courses/${enroll.courseId}`} className="book-card">
                    <div 
                      className="book-cover" 
                      style={{ borderLeftColor: getSpineColor(course.category) }}
                    >
                      <div>
                        <span className="book-cover-tag">{course.category}</span>
                        <h3 className="book-cover-title" style={{ fontSize: "1.25rem" }}>{course.title}</h3>
                      </div>
                      <div>
                        <div className="book-cover-author">Reference Vol. #{enroll.courseId}</div>
                      </div>
                    </div>
                  </Link>

                  {/* Progress Info & Control */}
                  <div className="reading-card" style={{ padding: "1.25rem", borderTop: "none", borderRadius: "0 0 var(--radius-md) var(--radius-md)", marginTop: "-1.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                      <span>Chapters Read</span>
                      <span style={{ color: "var(--text-main)" }}>{enroll.progressPercentage.toFixed(0)}%</span>
                    </div>

                    <div className="reading-ribbon-container" style={{ marginBottom: "1.25rem" }}>
                      <div className="reading-ribbon" style={{ width: `${enroll.progressPercentage}%` }} />
                    </div>

                    {updatingId === enroll.id ? (
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          className="form-input"
                          placeholder="%"
                          style={{ flex: 1, padding: "0.4rem 0.5rem", fontSize: "0.8rem" }}
                          value={progressInput}
                          onChange={(e) => setProgressInput(e.target.value)}
                        />
                        <button onClick={() => handleUpdateProgress(enroll.id)} className="btn btn-primary btn-sm" style={{ padding: "0.4rem 0.75rem" }}>
                          Save
                        </button>
                        <button onClick={() => setUpdatingId(null)} className="btn btn-secondary btn-sm" style={{ padding: "0.4rem 0.75rem" }}>
                          X
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        
                        {/* Assessment / Certification buttons */}
                        {hasFinishedCourse ? (
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button 
                              onClick={() => setActiveCertificate(enroll)} 
                              className="btn btn-success btn-sm" 
                              style={{ flex: 1, padding: "0.45rem", fontSize: "0.8rem" }}
                            >
                              🎓 View Certificate
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleLaunchQuiz(enroll)} 
                            className="btn btn-primary btn-sm" 
                            style={{ width: "100%", padding: "0.45rem", fontSize: "0.8rem" }}
                          >
                            📝 Take Certification Quiz
                          </button>
                        )}

                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "space-between", marginTop: "0.25rem", borderTop: "1px solid var(--border-color)", paddingTop: "0.5rem" }}>
                          <button onClick={() => setUpdatingId(enroll.id)} className="btn btn-secondary btn-sm" style={{ flex: 1, padding: "0.35rem", fontSize: "0.75rem" }}>
                            Manual Progress
                          </button>
                          <button onClick={() => handleCancelEnrollment(enroll.id)} className="btn btn-danger btn-sm" style={{ padding: "0.35rem", fontSize: "0.75rem" }}>
                            Return
                          </button>
                        </div>

                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* Section 2: Historical Archive Table */}
        <h3 className="bookshelf-title" style={{ fontSize: "1.75rem", marginTop: "4rem" }}>
          <span>Archive Return History</span>
        </h3>

        {inactiveEnrollments.length === 0 ? (
          <p style={{ fontStyle: "italic", color: "var(--text-muted)", fontSize: "0.9rem" }}>No return log items recorded.</p>
        ) : (
          <div className="table-wrapper">
            <table className="editorial-table">
              <thead>
                <tr>
                  <th>Volume ID</th>
                  <th>Title</th>
                  <th>Request Date</th>
                  <th>Final Progress</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {inactiveEnrollments.map((enroll) => {
                  const course = coursesMap[enroll.courseId] || {
                    title: `Course #${enroll.courseId}`,
                  };
                  return (
                    <tr key={enroll.id}>
                      <td style={{ fontWeight: "700" }}>Vol #{enroll.courseId}</td>
                      <td>{course.title}</td>
                      <td>{new Date(enroll.enrolledAt).toLocaleDateString()}</td>
                      <td>{enroll.progressPercentage.toFixed(1)}%</td>
                      <td>
                        <span className="badge badge-cancelled">{enroll.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Online Quiz Modal Simulator */}
      {activeQuizEnrollment && (() => {
        const questions = getQuizQuestions();
        const course = coursesMap[activeQuizEnrollment.courseId] || {};
        
        return (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: "550px", backgroundColor: "#ffffff", color: "#1e293b", padding: "2rem", borderRadius: "8px", fontFamily: "var(--font-sans)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
                <div>
                  <span style={{ fontSize: "0.7rem", fontWeight: "700", textTransform: "uppercase", color: "#64748b" }}>Course Assessment</span>
                  <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "700", color: "#0f172a" }}>{course.title}</h3>
                </div>
                <button 
                  onClick={() => setActiveQuizEnrollment(null)}
                  style={{ border: "none", backgroundColor: "transparent", fontSize: "1.25rem", cursor: "pointer", color: "#94a3b8" }}
                >
                  &times;
                </button>
              </div>

              {!quizFinished ? (
                <div>
                  {/* Progress bar */}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#64748b", marginBottom: "0.5rem" }}>
                    <span>Question {currentQuestionIdx + 1} of {questions.length}</span>
                    <span>{Math.round(((currentQuestionIdx) / questions.length) * 100)}% Complete</span>
                  </div>
                  <div style={{ height: "6px", backgroundColor: "#e2e8f0", borderRadius: "3px", overflow: "hidden", marginBottom: "1.5rem" }}>
                    <div style={{ width: `${((currentQuestionIdx + 1) / questions.length) * 100}%`, height: "100%", backgroundColor: "var(--primary)" }} />
                  </div>

                  {/* Question Prompt */}
                  <h4 style={{ fontSize: "1.05rem", fontWeight: "600", color: "#1e293b", marginBottom: "1.25rem", lineHeight: "1.5" }}>
                    {questions[currentQuestionIdx]?.question}
                  </h4>

                  {/* Options */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>
                    {questions[currentQuestionIdx]?.options.map((opt, idx) => {
                      const isSelected = selectedAnswers[currentQuestionIdx] === idx;
                      return (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => handleSelectAnswer(idx)}
                          style={{
                            padding: "1rem",
                            border: isSelected ? "2px solid var(--primary)" : "1px solid #cbd5e1",
                            borderRadius: "6px",
                            backgroundColor: isSelected ? "#fdf2f8" : "#ffffff",
                            textAlign: "left",
                            cursor: "pointer",
                            fontSize: "0.9rem",
                            fontWeight: isSelected ? "600" : "400",
                            color: isSelected ? "var(--primary)" : "#334155",
                            transition: "all 0.2s"
                          }}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      onClick={() => handleNextQuestion(questions)}
                      disabled={selectedAnswers[currentQuestionIdx] === undefined}
                      className="btn btn-primary"
                      style={{ padding: "0.6rem 1.5rem", fontSize: "0.85rem" }}
                    >
                      {currentQuestionIdx === questions.length - 1 ? "Submit Assessment" : "Next Question"}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                  {quizScore >= 4 ? (
                    <div>
                      <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#d1fae5", border: "2px solid #34d399", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem auto" }}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="#059669" style={{ width: "32px", height: "32px" }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </div>
                      <h3 style={{ color: "#065f46", fontSize: "1.5rem", fontWeight: "800", marginBottom: "0.5rem" }}>Assessment Passed!</h3>
                      <p style={{ fontSize: "0.9rem", color: "#047857", marginBottom: "2rem" }}>
                        You scored <strong>{quizScore} out of {questions.length}</strong> ({(quizScore / questions.length) * 100}%). This meets the scholastic standard of 80% to claim certificate.
                      </p>

                      <button
                        onClick={handleSaveQuizPassed}
                        disabled={quizSaving}
                        className="btn btn-success"
                        style={{ width: "100%", padding: "0.8rem", fontSize: "0.9rem" }}
                      >
                        {quizSaving ? "Saving progress..." : "Claim Certificate & Complete Course"}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#fee2e2", border: "2px solid #f87171", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem auto" }}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="#b91c1c" style={{ width: "32px", height: "32px" }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <h3 style={{ color: "#991b1b", fontSize: "1.5rem", fontWeight: "800", marginBottom: "0.5rem" }}>Scholastic Goal Not Met</h3>
                      <p style={{ fontSize: "0.9rem", color: "#b91c1c", marginBottom: "2rem" }}>
                        You scored <strong>{quizScore} out of {questions.length}</strong> ({(quizScore / questions.length) * 100}%). A minimum score of 80% (4 correct answers) is required to unlock certification.
                      </p>

                      <div style={{ display: "flex", gap: "1rem" }}>
                        <button
                          onClick={() => {
                            setCurrentQuestionIdx(0);
                            setSelectedAnswers({});
                            setQuizFinished(false);
                            setQuizScore(0);
                          }}
                          className="btn btn-primary"
                          style={{ flex: 1, padding: "0.6rem", fontSize: "0.85rem" }}
                        >
                          Retake Assessment
                        </button>
                        <button
                          onClick={() => setActiveQuizEnrollment(null)}
                          className="btn btn-secondary"
                          style={{ flex: 1, padding: "0.6rem", fontSize: "0.85rem" }}
                        >
                          Back to Shelf
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Printable Certificate Modal */}
      {activeCertificate && (() => {
        const course = coursesMap[activeCertificate.courseId] || {};
        const formattedDate = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
        
        return (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: "700px", padding: 0, border: "none", overflow: "hidden", borderRadius: "10px", backgroundColor: "#fff", color: "#1a1e26", fontFamily: "var(--font-sans)" }}>
              
              {/* Decorative Frame */}
              <div style={{ padding: "3rem", border: "15px solid #eae5db", margin: "10px", position: "relative" }}>
                
                {/* Gold Seal Watermark background */}
                <div style={{ position: "absolute", bottom: "20px", right: "20px", opacity: 0.15, pointerEvents: "none" }}>
                  <svg width="150" height="150" viewBox="0 0 100 100" fill="var(--primary)">
                    <circle cx="50" cy="50" r="40" stroke="var(--primary)" strokeWidth="3" fill="none" />
                    <path d="M50 20 L60 80 L20 40 L80 40 L40 80 Z" />
                  </svg>
                </div>

                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: "0.8rem", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: "700", color: "var(--text-muted)" }}>
                    LMS Space Digital Library
                  </span>
                  
                  <h2 style={{ fontSize: "2.2rem", fontWeight: "800", color: "var(--primary)", margin: "1.5rem 0", letterSpacing: "0.05em", borderBottom: "2px double var(--border-color)", paddingBottom: "1rem" }}>
                    CERTIFICATE OF COMPLETION
                  </h2>

                  <p style={{ fontStyle: "italic", fontSize: "1.05rem", color: "var(--text-muted)", margin: "2rem 0" }}>
                    This academic document certifies that the scholar
                  </p>

                  <h3 style={{ fontSize: "2.4rem", fontWeight: "800", color: "#000000", borderBottom: "1px solid var(--border-color)", display: "inline-block", padding: "0 2rem 0.5rem 2rem", margin: "0 auto 2rem auto" }}>
                    {user.fullName}
                  </h3>

                  <p style={{ fontStyle: "italic", fontSize: "1.05rem", color: "var(--text-muted)", margin: "0 auto 2rem auto", maxWidth: "480px", lineHeight: "1.6" }}>
                    has successfully satisfied all curriculum standards, reading requirements, and verified examinations for the course volume
                  </p>

                  <h4 style={{ fontSize: "1.45rem", fontWeight: "700", color: "var(--primary)", marginBottom: "2rem" }}>
                    {course.title}
                  </h4>

                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "4rem" }}>
                    Issued on this day: <strong>{formattedDate}</strong> <br/>
                    Verification Hash ID: <code>LMS-CERT-{activeCertificate.id}-{activeCertificate.studentId}-{new Date().getFullYear()}</code>
                  </p>

                  {/* Signatures */}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "0 2rem", marginTop: "3rem" }}>
                    <div style={{ textAlign: "center", width: "150px" }}>
                      <div style={{ borderBottom: "1px solid #1a1e26", height: "30px", fontStyle: "italic", fontSize: "1.1rem", fontFamily: "cursive", color: "var(--primary)" }}>
                        Shivam S.
                      </div>
                      <span style={{ fontSize: "0.7rem", textTransform: "uppercase", fontWeight: "700", color: "var(--text-muted)", display: "block", marginTop: "0.25rem" }}>
                        Chancellor, LMS
                      </span>
                    </div>

                    <div style={{ textAlign: "center", width: "150px" }}>
                      <div style={{ borderBottom: "1px solid #1a1e26", height: "30px", fontStyle: "italic", fontSize: "1.1rem", fontFamily: "cursive", color: "var(--primary)" }}>
                        Academic Board
                      </div>
                      <span style={{ fontSize: "0.7rem", textTransform: "uppercase", fontWeight: "700", color: "var(--text-muted)", display: "block", marginTop: "0.25rem" }}>
                        Dean of Studies
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Action options */}
              <div style={{ display: "flex", borderTop: "1px solid #cbd5e1" }}>
                <button
                  onClick={() => window.print()}
                  style={{ flex: 1, padding: "1rem", border: "none", backgroundColor: "#f8fafc", color: "var(--text-main)", cursor: "pointer", fontWeight: "700", borderRight: "1px solid #cbd5e1" }}
                >
                  🖨️ Print / Download PDF
                </button>
                <button
                  onClick={() => setActiveCertificate(null)}
                  style={{ flex: 1, padding: "1rem", border: "none", backgroundColor: "#ffffff", color: "var(--danger)", cursor: "pointer", fontWeight: "700" }}
                >
                  Close Document
                </button>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default StudentDashboard;
