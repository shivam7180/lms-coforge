import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import courseService from "../services/courseService";
import authService from "../services/authService";
import CourseMediaViewer from "../components/CourseMediaViewer";

const BLANK_CHAPTERS = [
  { chapterNumber: "01", title: "", description: "" }
];

const EditCourse = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Computer Science");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [notesContent, setNotesContent] = useState("");

  // Video Playlist / Folder States
  const [videosList, setVideosList] = useState([]);
  const [folderUploading, setFolderUploading] = useState(false);
  const [currentUploadingIndex, setCurrentUploadingIndex] = useState(0);
  const [totalFilesToUpload, setTotalFilesToUpload] = useState(0);
  const [currentFileProgress, setCurrentFileProgress] = useState(0);
  const [currentUploadingFileName, setCurrentUploadingFileName] = useState("");

  // Multiple Notes Documents States
  const [notesList, setNotesList] = useState([]);
  const [notesUploading, setNotesUploading] = useState(false);
  const [notesUploadProgress, setNotesUploadProgress] = useState(0);

  // Manual Table of Contents State (Blank format)
  const [chapters, setChapters] = useState(BLANK_CHAPTERS);

  // Assessment Quiz Builder State
  const [quizQuestions, setQuizQuestions] = useState([]);

  const [previewActive, setPreviewActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const data = await courseService.getCourseById(id);
        setTitle(data.title || "");
        setDescription(data.description || "");
        setCategory(data.category || "Computer Science");
        setPrice(data.price ? data.price.toString() : "");
        setDuration(data.duration || "");
        setNotesContent(data.notesContent || "");

        // Parse video folder playlist
        if (data.videosJson) {
          try {
            const parsed = JSON.parse(data.videosJson);
            if (Array.isArray(parsed)) {
              setVideosList(parsed);
            }
          } catch (e) {
            console.error("Failed to parse videosJson", e);
          }
        } else if (data.videoUrl) {
          setVideosList([{
            id: "vid_legacy_1",
            title: data.title + " (Primary Video)",
            fileName: "video.mp4",
            originalName: "video.mp4",
            fileUrl: data.videoUrl,
          }]);
        }

        // Parse multiple notes documents
        if (data.notesJson) {
          try {
            const parsed = JSON.parse(data.notesJson);
            if (Array.isArray(parsed)) {
              setNotesList(parsed);
            }
          } catch (e) {
            console.error("Failed to parse notesJson", e);
          }
        } else if (data.notesUrl) {
          setNotesList([{
            id: "notes_legacy_1",
            title: data.title + " (Primary Notes)",
            fileName: "notes.pdf",
            originalName: "course_notes.pdf",
            fileUrl: data.notesUrl,
          }]);
        }

        // Parse Table of Contents chapters
        if (data.tableOfContents) {
          try {
            const parsedToc = JSON.parse(data.tableOfContents);
            if (Array.isArray(parsedToc) && parsedToc.length > 0) {
              setChapters(parsedToc);
            }
          } catch (e) {
            console.error("Failed to parse tableOfContents", e);
          }
        }

        // Parse Quiz Questions
        if (data.quizJson) {
          try {
            const parsedQuiz = JSON.parse(data.quizJson);
            if (Array.isArray(parsedQuiz) && parsedQuiz.length > 0) {
              setQuizQuestions(parsedQuiz);
            }
          } catch (e) {
            console.error("Failed to parse quizJson", e);
          }
        }

        setLoading(false);
      } catch (err) {
        setLoading(false);
        setError("Failed to load course details for editing.");
      }
    };

    fetchCourse();
  }, [id]);

  const isVideoFile = (file) => {
    if (!file) return false;
    if (file.type && file.type.startsWith("video/")) return true;
    return /\.(mp4|webm|ogg|mov|mkv|avi|flv|wmv|m4v|3gp|ts)$/i.test(file.name);
  };

  // Upload more video files / folder to append to existing course playlist
  const handleAppendVideoFolderUpload = async (e) => {
    const rawFiles = Array.from(e.target.files);
    if (rawFiles.length === 0) return;

    const videoFiles = rawFiles
      .filter(isVideoFile)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));

    if (videoFiles.length === 0) {
      setError(`No video files found among ${rawFiles.length} selected files.`);
      return;
    }

    setFolderUploading(true);
    setTotalFilesToUpload(videoFiles.length);
    setError("");

    let failedCount = 0;

    for (let i = 0; i < videoFiles.length; i++) {
      const file = videoFiles[i];
      setCurrentUploadingIndex(i + 1);
      setCurrentUploadingFileName(file.name);
      setCurrentFileProgress(0);

      let success = false;
      let lastErr = null;

      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const res = await courseService.uploadFile(file, "video", (progress) => {
            setCurrentFileProgress(progress);
          });

          const videoItem = {
            id: `vid_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 4)}`,
            title: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
            fileName: res.fileName,
            originalName: file.name,
            fileUrl: res.fileUrl,
          };

          // Append to existing playlist
          setVideosList((prev) => [...prev, videoItem]);
          success = true;
          break;
        } catch (err) {
          lastErr = err;
          await new Promise((r) => setTimeout(r, 400));
        }
      }

      if (!success) {
        console.error(`Failed to upload ${file.name}:`, lastErr);
        failedCount++;
      }

      await new Promise((r) => setTimeout(r, 150));
    }

    setFolderUploading(false);
    setCurrentUploadingFileName("");
    setPreviewActive(true);

    if (failedCount > 0) {
      setError(`Uploaded ${videoFiles.length - failedCount} of ${videoFiles.length} videos. ${failedCount} file(s) encountered an error.`);
    } else {
      setSuccessMsg(`Successfully added ${videoFiles.length} new video lesson(s) to this course!`);
      setTimeout(() => setSuccessMsg(""), 4000);
    }
  };

  const handleRemoveVideo = (idToRemove) => {
    setVideosList((prev) => prev.filter((v) => v.id !== idToRemove));
  };

  const handleUpdateVideoTitle = (id, newTitle) => {
    setVideosList((prev) =>
      prev.map((v) => (v.id === id ? { ...v, title: newTitle } : v))
    );
  };

  // Upload more notes files to append without overriding previous notes
  const handleAppendNotesUpload = async (e) => {
    const rawFiles = Array.from(e.target.files);
    if (rawFiles.length === 0) return;

    setNotesUploading(true);
    setNotesUploadProgress(0);
    setError("");

    for (let i = 0; i < rawFiles.length; i++) {
      const file = rawFiles[i];
      try {
        const res = await courseService.uploadFile(file, "notes", (progress) => {
          setNotesUploadProgress(progress);
        });

        const notesItem = {
          id: `notes_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 4)}`,
          title: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
          fileName: res.fileName,
          originalName: file.name,
          fileUrl: res.fileUrl,
        };

        // Append to existing notes without overriding
        setNotesList((prev) => [...prev, notesItem]);
      } catch (err) {
        console.error(`Error uploading notes ${file.name}:`, err);
        setError(`Failed to upload notes file ${file.name}.`);
      }
    }

    setNotesUploading(false);
    setSuccessMsg(`Successfully added ${rawFiles.length} notes file(s) to course!`);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const handleRemoveNotes = (idToRemove) => {
    setNotesList((prev) => prev.filter((n) => n.id !== idToRemove));
  };

  const handleUpdateNotesTitle = (id, newTitle) => {
    setNotesList((prev) =>
      prev.map((n) => (n.id === id ? { ...n, title: newTitle } : n))
    );
  };

  // Table of contents chapter handlers
  const handleAddChapter = () => {
    const nextNum = (chapters.length + 1).toString().padStart(2, "0");
    setChapters([
      ...chapters,
      { chapterNumber: nextNum, title: "", description: "" }
    ]);
  };

  const handleUpdateChapter = (index, field, value) => {
    const updated = [...chapters];
    updated[index][field] = value;
    setChapters(updated);
  };

  const handleRemoveChapter = (index) => {
    const updated = chapters.filter((_, i) => i !== index);
    const renumbered = updated.map((ch, idx) => ({
      ...ch,
      chapterNumber: (idx + 1).toString().padStart(2, "0")
    }));
    setChapters(renumbered);
  };

  // Quiz Handlers
  const handleAddQuizQuestion = () => {
    setQuizQuestions([
      ...quizQuestions,
      {
        id: `q_${Date.now()}_${quizQuestions.length}`,
        question: "",
        options: ["", "", "", ""],
        correctIndex: 0,
      },
    ]);
  };

  const handleUpdateQuizQuestion = (index, value) => {
    const updated = [...quizQuestions];
    updated[index].question = value;
    setQuizQuestions(updated);
  };

  const handleUpdateQuizOption = (qIndex, optIndex, value) => {
    const updated = [...quizQuestions];
    updated[qIndex].options[optIndex] = value;
    setQuizQuestions(updated);
  };

  const handleSetCorrectOption = (qIndex, correctIndex) => {
    const updated = [...quizQuestions];
    updated[qIndex].correctIndex = correctIndex;
    setQuizQuestions(updated);
  };

  const handleRemoveQuizQuestion = (index) => {
    setQuizQuestions(quizQuestions.filter((_, i) => i !== index));
  };

  const handleInsertSampleQuiz = () => {
    setQuizQuestions([
      {
        id: `q_${Date.now()}_0`,
        question: `What is the foundational concept covered in ${title || "this course"}?`,
        options: [
          "Mastering core principles, practical architecture, and robust coding",
          "Memorizing abstract theoretical notes without practical implementation",
          "Skipping unit testing and deploying untested components",
          "Manual server restarts without automated supervision"
        ],
        correctIndex: 0,
      },
      {
        id: `q_${Date.now()}_1`,
        question: "Which architectural approach ensures high availability and modular scaling?",
        options: [
          "Single monolithic database bottleneck without caching",
          "Decoupled stateless microservices registered with discovery server",
          "Unencrypted hardcoded database credentials in production",
          "Synchronous sequential batch processing with zero failover"
        ],
        correctIndex: 1,
      },
      {
        id: `q_${Date.now()}_2`,
        question: "When is the final course assessment quiz unlocked for enrolled students?",
        options: [
          "Immediately upon registration",
          "After watching 100% of all lecture videos",
          "Only when instructors manually approve access",
          "Never"
        ],
        correctIndex: 1,
      }
    ]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (folderUploading || notesUploading) {
      setError("Please wait for uploads to complete before saving.");
      return;
    }
    if (!title || !description || !category || !price) {
      setError("Please fill in all mandatory fields.");
      return;
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError("Price must be a positive number.");
      return;
    }

    setError("");
    setSaving(true);

    try {
      const primaryVideoUrl = videosList.length > 0 ? videosList[0].fileUrl : null;
      const videosJsonString = videosList.length > 0 ? JSON.stringify(videosList) : null;
      const primaryNotesUrl = notesList.length > 0 ? notesList[0].fileUrl : null;
      const notesJsonString = notesList.length > 0 ? JSON.stringify(notesList) : null;
      const validChapters = chapters.filter((ch) => ch.title && ch.title.trim().length > 0);
      const tableOfContentsJsonString = validChapters.length > 0 ? JSON.stringify(validChapters) : null;
      
      const validQuizQuestions = quizQuestions.filter((q) => q.question && q.question.trim().length > 0);
      const quizJsonString = validQuizQuestions.length > 0 ? JSON.stringify(validQuizQuestions) : null;

      await courseService.updateCourse(id, {
        title,
        description,
        category,
        instructorName: user?.fullName || user?.name || "Instructor",
        price: parsedPrice,
        duration: duration.trim() || null,
        videoUrl: primaryVideoUrl,
        videosJson: videosJsonString,
        notesUrl: primaryNotesUrl,
        notesJson: notesJsonString,
        notesContent: notesContent.trim() || null,
        tableOfContents: tableOfContentsJsonString,
        quizJson: quizJsonString,
      });

      setSaving(false);
      setSuccessMsg("Course updated successfully with updated videos, notes, and syllabus!");
      setTimeout(() => {
        navigate(`/instructor/dashboard?msg=updated&title=${encodeURIComponent(title)}`);
      }, 1200);
    } catch (err) {
      setSaving(false);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Failed to update course.");
      }
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "5rem 0" }}>
        <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Loading course data from the archive...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "4rem 0", display: "flex", justifyContent: "center" }} className="fade-in">
      <div className="reading-card" style={{ width: "100%", maxWidth: "850px", padding: "3rem", position: "relative" }}>
        <div className="bookmark-accent" style={{ height: "45px" }}></div>
        
        <Link to="/instructor/dashboard" style={{ color: "var(--text-muted)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.5rem", marginBottom: "2rem", fontWeight: "600", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          &larr; Back to Instructor Workspace
        </Link>
        
        <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "1.25rem", marginBottom: "2rem" }}>
          <span className="editorial-title-badge">Curator Editing Studio</span>
          <h2 style={{ margin: "0.5rem 0 0.25rem 0", fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: "400", fontSize: "2.2rem" }}>
            Edit Course #{id}
          </h2>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Append new video lessons from folder, attach new study notes, and modify chapter outlines.
          </p>
        </div>

        {error && (
          <div style={{ backgroundColor: "rgba(185, 28, 28, 0.12)", color: "var(--danger)", padding: "0.75rem 1.25rem", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", marginBottom: "1.5rem", border: "1px solid rgba(185, 28, 28, 0.3)" }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div style={{ backgroundColor: "rgba(34, 197, 94, 0.12)", color: "var(--success)", padding: "0.75rem 1.25rem", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", marginBottom: "1.5rem", border: "1px solid rgba(34, 197, 94, 0.3)", fontWeight: "600" }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Section 1: Metadata */}
          <div style={{ marginBottom: "2.5rem" }}>
            <h3 style={{ fontSize: "1.15rem", marginBottom: "1.25rem", color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span>1.</span> Course Metadata & Pricing
            </h3>

            <div className="form-group">
              <label className="form-label" htmlFor="title">Volume / Course Title *</label>
              <input
                type="text"
                id="title"
                className="form-input"
                style={{ backgroundColor: "var(--bg-primary)" }}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "1.25rem" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="category">Catalog Category *</label>
                <select
                  id="category"
                  className="form-input"
                  style={{ backgroundColor: "var(--bg-primary)", cursor: "pointer" }}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Business & Finance">Business & Finance</option>
                  <option value="Design & Art">Design & Art</option>
                  <option value="Marketing">Marketing</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="price">Tuition Fee (INR - ₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  id="price"
                  className="form-input"
                  style={{ backgroundColor: "var(--bg-primary)" }}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="duration">Course Duration (in Months) *</label>
                <select
                  id="duration"
                  className="form-input"
                  style={{ backgroundColor: "var(--bg-primary)", cursor: "pointer" }}
                  value={duration || "3 Months"}
                  onChange={(e) => setDuration(e.target.value)}
                  required
                >
                  <option value="1 Month">1 Month</option>
                  <option value="2 Months">2 Months</option>
                  <option value="3 Months">3 Months</option>
                  <option value="4 Months">4 Months</option>
                  <option value="5 Months">5 Months</option>
                  <option value="6 Months">6 Months</option>
                  <option value="7 Months">7 Months</option>
                  <option value="8 Months">8 Months</option>
                  <option value="9 Months">9 Months</option>
                  <option value="10 Months">10 Months</option>
                  <option value="11 Months">11 Months</option>
                  <option value="12 Months">12 Months (1 Year)</option>
                  <option value="18 Months">18 Months (1.5 Years)</option>
                  <option value="24 Months">24 Months (2 Years)</option>
                  <option value="36 Months">36 Months (3 Years)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="description">Course Abstract / Syllabus Summary *</label>
              <textarea
                id="description"
                className="form-input"
                style={{ height: "100px", resize: "none", backgroundColor: "var(--bg-primary)" }}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Section 2: Manage & Append Videos to Course Playlist */}
          <div style={{ marginBottom: "2.5rem", borderTop: "1px solid var(--border-color)", paddingTop: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.15rem", margin: 0, color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>2.</span> Course Video Lessons Playlist 📹 ({videosList.length} Lessons)
              </h3>
              {videosList.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPreviewActive(!previewActive)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: "0.75rem", padding: "0.2rem 0.6rem" }}
                >
                  {previewActive ? "Hide Player" : "Preview Player"}
                </button>
              )}
            </div>

            {/* Append More Videos Action Box */}
            <div style={{
              backgroundColor: "var(--bg-secondary)",
              padding: "1.25rem",
              borderRadius: "var(--radius-sm)",
              border: "1px dashed var(--border-color)",
              marginBottom: "1rem"
            }}>
              <label className="form-label" style={{ fontWeight: "700", marginBottom: "0.5rem", display: "block" }}>
                ➕ Add More Videos into Course Folder Playlist
              </label>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0 0 0.75rem 0" }}>
                Select another video folder or new video files to append more lessons without losing existing ones.
              </p>
              
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                <label className="btn btn-primary btn-sm" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>📁</span> ➕ Append Video Folder
                  <input
                    type="file"
                    webkitdirectory=""
                    directory=""
                    multiple
                    onChange={handleAppendVideoFolderUpload}
                    disabled={folderUploading}
                    style={{ display: "none" }}
                  />
                </label>

                <label className="btn btn-secondary btn-sm" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>🎬</span> ➕ Append Video File(s)
                  <input
                    type="file"
                    accept="video/*,.mp4,.webm,.ogg,.mov,.mkv,.avi,.flv,.wmv,.m4v,.3gp,.ts"
                    multiple
                    onChange={handleAppendVideoFolderUpload}
                    disabled={folderUploading}
                    style={{ display: "none" }}
                  />
                </label>
              </div>

              {/* Progress Indicator */}
              {folderUploading && (
                <div style={{ marginTop: "1.25rem", padding: "1.25rem", backgroundColor: "var(--bg-card)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--primary)", fontWeight: "700", marginBottom: "0.4rem" }}>
                    <span>
                      Uploading Lesson {currentUploadingIndex} of {totalFilesToUpload}: "{currentUploadingFileName}"
                    </span>
                    <span>{currentFileProgress}%</span>
                  </div>
                  <div style={{ height: "8px", backgroundColor: "rgba(0,0,0,0.1)", borderRadius: "4px", overflow: "hidden", marginBottom: "0.5rem" }}>
                    <div style={{ height: "100%", width: `${currentFileProgress}%`, backgroundColor: "var(--primary)", transition: "width 0.2s ease" }} />
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
                    <span>Total playlist: {videosList.length} lessons</span>
                    <span>Please do not close this tab...</span>
                  </div>
                </div>
              )}
            </div>

            {/* List of Existing & New Videos */}
            {videosList.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "400px", overflowY: "auto", paddingRight: "0.25rem" }}>
                {videosList.map((vid, idx) => (
                  <div
                    key={vid.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.6rem 0.85rem",
                      backgroundColor: "var(--bg-primary)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-color)"
                    }}
                  >
                    <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--primary)", minWidth: "24px" }}>
                      {(idx + 1).toString().padStart(2, "0")}
                    </span>
                    <input
                      type="text"
                      className="form-input"
                      style={{ flex: 1, padding: "0.35rem 0.6rem", fontSize: "0.85rem" }}
                      value={vid.title}
                      onChange={(e) => handleUpdateVideoTitle(vid.id, e.target.value)}
                      placeholder="Lesson title..."
                    />
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {vid.originalName}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveVideo(vid.id)}
                      className="btn btn-danger btn-sm"
                      style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                      title="Remove this video lesson"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Live Playlist Preview */}
            {previewActive && (
              <div style={{ marginTop: "1.25rem" }}>
                <CourseMediaViewer videosJson={videosList} notesJson={notesList} notesContent={notesContent} title={title} />
              </div>
            )}
          </div>

          {/* Section 3: Manual Table of Contents Customizer */}
          <div style={{ marginBottom: "2.5rem", borderTop: "1px solid var(--border-color)", paddingTop: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ fontSize: "1.15rem", margin: 0, color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>3.</span> Manual Table of Contents (Syllabus Chapters) 📋
                </h3>
                <small style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                  Customize chapter numbers, titles, and syllabus outlines manually.
                </small>
              </div>
              <button
                type="button"
                onClick={handleAddChapter}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: "0.8rem", padding: "0.3rem 0.75rem" }}
              >
                + Add Chapter
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {chapters.length === 0 ? (
                <div style={{ textAlign: "center", padding: "1.75rem", backgroundColor: "var(--bg-secondary)", borderRadius: "var(--radius-sm)", border: "1px dashed var(--border-color)" }}>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "0 0 0.75rem 0" }}>
                    No chapters defined yet. Click below to add Chapter 01.
                  </p>
                  <button
                    type="button"
                    onClick={handleAddChapter}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: "0.8rem" }}
                  >
                    ➕ Add Chapter 01
                  </button>
                </div>
              ) : (
                chapters.map((ch, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "1rem 1.25rem",
                      backgroundColor: "var(--bg-secondary)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-color)"
                    }}
                  >
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "0.5rem" }}>
                      <input
                        type="text"
                        className="form-input"
                        style={{ width: "60px", textAlign: "center", fontWeight: "700", backgroundColor: "var(--bg-primary)", padding: "0.35rem 0.5rem" }}
                        value={ch.chapterNumber}
                        onChange={(e) => handleUpdateChapter(idx, "chapterNumber", e.target.value)}
                        placeholder="01"
                      />
                      <input
                        type="text"
                        className="form-input"
                        style={{ flex: 1, backgroundColor: "var(--bg-primary)", padding: "0.35rem 0.6rem" }}
                        value={ch.title}
                        onChange={(e) => handleUpdateChapter(idx, "title", e.target.value)}
                        placeholder={`Chapter ${idx + 1} Title (write manually)`}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveChapter(idx)}
                        className="btn btn-danger btn-sm"
                        style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem" }}
                        title="Delete Chapter"
                      >
                        Delete
                      </button>
                    </div>
                    <textarea
                      className="form-input"
                      style={{ width: "100%", height: "60px", resize: "none", backgroundColor: "var(--bg-primary)", fontSize: "0.82rem" }}
                      value={ch.description}
                      onChange={(e) => handleUpdateChapter(idx, "description", e.target.value)}
                      placeholder="Chapter topics summary, key takeaways, or lecture outline..."
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section 4: Study Notes Documents Collection */}
          <div style={{ marginBottom: "2.5rem", borderTop: "1px solid var(--border-color)", paddingTop: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ fontSize: "1.15rem", margin: 0, color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>4.</span> Course Study Notes & Documents 📄 ({notesList.length} Attached)
                </h3>
                <small style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                  Upload new notes files for this course without overwriting existing ones.
                </small>
              </div>
            </div>

            {/* Notes Multi-File Append Upload Box */}
            <div style={{
              backgroundColor: "var(--bg-secondary)",
              padding: "1.25rem",
              borderRadius: "var(--radius-sm)",
              border: "1px dashed var(--border-color)",
              marginBottom: "1rem"
            }}>
              <label className="form-label" style={{ fontWeight: "700", marginBottom: "0.5rem", display: "block" }}>
                ➕ Attach More Notes File(s) (.pdf, .docx, .txt, .md, .zip)
              </label>
              
              <label className="btn btn-secondary btn-sm" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                <span>📑</span> ➕ Add More Notes File(s)
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.md,.zip,application/pdf"
                  multiple
                  onChange={handleAppendNotesUpload}
                  disabled={notesUploading}
                  style={{ display: "none" }}
                />
              </label>

              {notesUploading && (
                <div style={{ marginTop: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--primary)", fontWeight: "600", marginBottom: "0.25rem" }}>
                    <span>Uploading notes document...</span>
                    <span>{notesUploadProgress}%</span>
                  </div>
                  <div style={{ height: "6px", backgroundColor: "rgba(0,0,0,0.1)", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${notesUploadProgress}%`, backgroundColor: "var(--primary)", transition: "width 0.2s ease" }} />
                  </div>
                </div>
              )}
            </div>

            {/* List of Attached Notes Files */}
            {notesList.length > 0 && (
              <div style={{ marginBottom: "1.5rem" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", display: "block", marginBottom: "0.5rem" }}>
                  Attached Notes Files List:
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {notesList.map((doc, idx) => (
                    <div
                      key={doc.id || idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        padding: "0.6rem 0.85rem",
                        backgroundColor: "var(--bg-primary)",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border-color)"
                      }}
                    >
                      <span style={{ fontSize: "1.1rem" }}>📑</span>
                      <input
                        type="text"
                        className="form-input"
                        style={{ flex: 1, padding: "0.35rem 0.6rem", fontSize: "0.85rem" }}
                        value={doc.title}
                        onChange={(e) => handleUpdateNotesTitle(doc.id, e.target.value)}
                        placeholder="Document title (e.g. Chapter 1 Notes)..."
                      />
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {doc.originalName || doc.fileName}
                      </span>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                      >
                        View &nearr;
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRemoveNotes(doc.id)}
                        className="btn btn-danger btn-sm"
                        style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                        title="Remove this notes file"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="notesContent">
                Curriculum Study Notes & Text Materials (Optional)
              </label>
              <textarea
                id="notesContent"
                className="form-input"
                style={{ height: "140px", resize: "vertical", fontFamily: "monospace", fontSize: "0.85rem", backgroundColor: "var(--bg-primary)" }}
                value={notesContent}
                onChange={(e) => setNotesContent(e.target.value)}
                placeholder="Type or paste markdown study notes..."
              />
            </div>
          </div>

          {/* Section 5: Assessment & Certification Quiz Builder */}
          <div style={{ backgroundColor: "var(--bg-secondary)", padding: "1.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", marginBottom: "2.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <span className="editorial-title-badge">Assessment Portal</span>
                <h3 style={{ fontSize: "1.4rem", margin: "0.25rem 0" }}>Final Course Assessment Quiz</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0, maxWidth: "560px" }}>
                  Upload customized assessment questions. Students can only unlock and take this quiz <strong>after completing 100% of all video lectures</strong> and must score <strong>&gt; 80% to pass</strong>.
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={handleInsertSampleQuiz}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem" }}
                  title="Populate questions with pre-configured template"
                >
                  ⚡ Insert Sample Quiz Template
                </button>
                <button
                  type="button"
                  onClick={handleAddQuizQuestion}
                  className="btn btn-primary btn-sm"
                  style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem" }}
                >
                  ➕ Add Question
                </button>
              </div>
            </div>

            {quizQuestions.length === 0 ? (
              <div style={{ border: "1px dashed var(--border-color)", padding: "2rem", borderRadius: "var(--radius-sm)", textAlign: "center", backgroundColor: "var(--bg-primary)" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1rem" }}>
                  No custom assessment questions added yet. Click below to add multiple-choice questions or insert a sample quiz template.
                </p>
                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
                  <button type="button" onClick={handleAddQuizQuestion} className="btn btn-secondary btn-sm">
                    ➕ Add Blank Question
                  </button>
                  <button type="button" onClick={handleInsertSampleQuiz} className="btn btn-primary btn-sm">
                    ⚡ Insert 3 Sample Questions
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {quizQuestions.map((q, qIdx) => (
                  <div
                    key={q.id || qIdx}
                    style={{
                      backgroundColor: "var(--bg-primary)",
                      padding: "1.25rem",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-color)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: "700", textTransform: "uppercase", color: "var(--primary)" }}>
                        Question #{String(qIdx + 1).padStart(2, "0")}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuizQuestion(qIdx)}
                        className="btn btn-danger btn-sm"
                        style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem" }}
                        title="Remove question"
                      >
                        🗑️ Remove
                      </button>
                    </div>

                    <div style={{ marginBottom: "1rem" }}>
                      <label className="form-label" style={{ fontSize: "0.8rem", marginBottom: "0.25rem" }}>
                        Question Statement *
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. What is the key advantage of microservices architecture?"
                        value={q.question}
                        onChange={(e) => handleUpdateQuizQuestion(qIdx, e.target.value)}
                        style={{ fontSize: "0.9rem" }}
                      />
                    </div>

                    <label className="form-label" style={{ fontSize: "0.8rem", marginBottom: "0.35rem", display: "block" }}>
                      Options & Correct Answer (Select the radio button next to the correct answer)
                    </label>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      {q.options.map((opt, optIdx) => {
                        const optLetter = ["A", "B", "C", "D"][optIdx] || String(optIdx + 1);
                        const isCorrect = q.correctIndex === optIdx;
                        return (
                          <div
                            key={optIdx}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              padding: "0.4rem 0.6rem",
                              backgroundColor: isCorrect ? "rgba(46, 98, 60, 0.12)" : "var(--bg-card)",
                              border: `1px solid ${isCorrect ? "var(--success)" : "var(--border-color)"}`,
                              borderRadius: "var(--radius-sm)"
                            }}
                          >
                            <input
                              type="radio"
                              name={`correct_edit_${q.id || qIdx}`}
                              checked={isCorrect}
                              onChange={() => handleSetCorrectOption(qIdx, optIdx)}
                              style={{ cursor: "pointer", accentColor: "var(--success)" }}
                              title="Set as correct answer"
                            />
                            <span style={{ fontWeight: "700", fontSize: "0.8rem", color: isCorrect ? "var(--success)" : "var(--text-muted)" }}>
                              {optLetter}:
                            </span>
                            <input
                              type="text"
                              className="form-input"
                              placeholder={`Option ${optLetter}...`}
                              value={opt}
                              onChange={(e) => handleUpdateQuizOption(qIdx, optIdx, e.target.value)}
                              style={{ flex: 1, padding: "0.3rem 0.5rem", fontSize: "0.85rem", border: "none", backgroundColor: "transparent" }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", padding: "1rem 1.5rem", fontSize: "1.05rem", fontWeight: "700" }}
            disabled={saving || folderUploading || notesUploading}
          >
            {saving ? "Saving Changes to Archive..." : "💾 Save Changes & Update Course"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditCourse;
