import React, { useState } from "react";

export const getDocIcon = (filename = "") => {
  if (!filename) return "📑";
  if (/\.pdf$/i.test(filename)) return "📕";
  if (/\.(doc|docx)$/i.test(filename)) return "📘";
  if (/\.(txt|md)$/i.test(filename)) return "📄";
  if (/\.zip$/i.test(filename)) return "📦";
  return "📑";
};

export const resolveMediaUrl = (url) => {
  if (!url) return "";
  const trimmed = url.trim();
  const baseUrl = (typeof import.meta !== "undefined" && (import.meta.env?.VITE_API_BASE_URL || import.meta.env?.VITE_API_URL)) || "http://localhost:8080";
  if (trimmed.startsWith("/api/")) {
    return `${baseUrl.replace(/\/$/, "")}${trimmed}`;
  }
  return trimmed;
};

export const getEmbedUrl = (url) => {
  if (!url) return null;
  const trimmed = url.trim();

  // YouTube watch format
  const ytMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return {
      type: "iframe",
      src: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0`
    };
  }

  // Vimeo format
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: "iframe",
      src: `https://player.vimeo.com/video/${vimeoMatch[1]}`
    };
  }

  // Direct backend course files or video extensions
  if (trimmed.includes("/api/courses/files/") || /\.(mp4|webm|ogg|mov|mkv|m4v|avi|ts|flv)(\?.*)?$/i.test(trimmed)) {
    return {
      type: "video",
      src: resolveMediaUrl(trimmed)
    };
  }

  // Generic link / other embeds
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return {
      type: "generic",
      src: trimmed
    };
  }

  return null;
};

const CourseMediaViewer = ({ 
  videoUrl, 
  notesUrl, 
  notesContent, 
  videosJson, 
  notesJson, 
  title = "Course Media",
  enrollmentId = null,
  onVideoCompleted = null
}) => {
  // Parse playlist of videos if available
  const parsedVideos = React.useMemo(() => {
    if (!videosJson) return [];
    try {
      if (Array.isArray(videosJson)) return videosJson;
      const parsed = JSON.parse(videosJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }, [videosJson]);

  // Parse collection of notes documents if available
  const parsedNotes = React.useMemo(() => {
    if (!notesJson) {
      if (notesUrl) {
        return [{
          id: "notes_default_1",
          title: "Primary Course Notes Document",
          fileName: "notes.pdf",
          originalName: "course_notes.pdf",
          fileUrl: notesUrl
        }];
      }
      return [];
    }
    try {
      if (Array.isArray(notesJson)) return notesJson;
      const parsed = JSON.parse(notesJson);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : (notesUrl ? [{
        id: "notes_default_1",
        title: "Primary Course Notes Document",
        fileName: "notes.pdf",
        originalName: "course_notes.pdf",
        fileUrl: notesUrl
      }] : []);
    } catch (e) {
      return notesUrl ? [{
        id: "notes_default_1",
        title: "Primary Course Notes Document",
        fileName: "notes.pdf",
        originalName: "course_notes.pdf",
        fileUrl: notesUrl
      }] : [];
    }
  }, [notesJson, notesUrl]);

  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [justCompletedIndex, setJustCompletedIndex] = useState(null);

  // Completed video indices for this enrollment
  const [completedIndices, setCompletedIndices] = useState(() => {
    if (!enrollmentId) return new Set();
    try {
      const saved = localStorage.getItem(`course_completed_vids_${enrollmentId}`);
      if (saved) {
        const arr = JSON.parse(saved);
        return new Set(Array.isArray(arr) ? arr : []);
      }
    } catch (e) {}
    return new Set();
  });

  // Handle video playback ended (Automatic progress trigger)
  const handleVideoEnded = (idx) => {
    const totalVideos = Math.max(parsedVideos.length, 1);
    const updated = new Set(completedIndices);
    updated.add(idx);
    setCompletedIndices(updated);
    setJustCompletedIndex(idx);

    if (enrollmentId) {
      try {
        localStorage.setItem(`course_completed_vids_${enrollmentId}`, JSON.stringify(Array.from(updated)));
      } catch (e) {}
    }

    const newProgress = Math.min(100, Math.round((updated.size / totalVideos) * 100));
    if (onVideoCompleted) {
      onVideoCompleted(idx, newProgress);
    }
  };

  // Active current video URL
  const currentVideoUrl = parsedVideos.length > 0 && parsedVideos[selectedVideoIndex]
    ? parsedVideos[selectedVideoIndex].fileUrl
    : videoUrl;

  const currentVideoTitle = parsedVideos.length > 0 && parsedVideos[selectedVideoIndex]
    ? parsedVideos[selectedVideoIndex].title || parsedVideos[selectedVideoIndex].originalName || `Lesson ${selectedVideoIndex + 1}`
    : title;

  const hasVideos = !!currentVideoUrl || parsedVideos.length > 0;
  const hasNotes = parsedNotes.length > 0 || !!notesUrl || !!notesContent;

  const [activeTab, setActiveTab] = useState(hasVideos ? "video" : "notes");

  const embed = getEmbedUrl(currentVideoUrl);

  const getDocIcon = (filename = "") => {
    const lower = filename.toLowerCase();
    if (lower.endsWith(".pdf")) return "📕";
    if (lower.endsWith(".doc") || lower.endsWith(".docx")) return "📘";
    if (lower.endsWith(".zip") || lower.endsWith(".rar")) return "📦";
    if (lower.endsWith(".txt") || lower.endsWith(".md")) return "📄";
    return "📑";
  };

  return (
    <div className="course-media-viewer" style={{
      backgroundColor: "var(--bg-card)",
      border: "1px solid var(--border-color)",
      borderRadius: "var(--radius-md)",
      overflow: "hidden",
      boxShadow: "var(--shadow-sm)",
      marginBottom: "2rem"
    }}>
      {/* Tab Navigation */}
      <div style={{
        display: "flex",
        borderBottom: "1px solid var(--border-color)",
        backgroundColor: "var(--bg-secondary)"
      }}>
        {hasVideos && (
          <button
            type="button"
            onClick={() => setActiveTab("video")}
            style={{
              flex: 1,
              padding: "0.85rem 1.25rem",
              background: activeTab === "video" ? "var(--bg-card)" : "transparent",
              color: activeTab === "video" ? "var(--primary)" : "var(--text-muted)",
              border: "none",
              borderBottom: activeTab === "video" ? "2px solid var(--primary)" : "2px solid transparent",
              fontWeight: "600",
              fontSize: "0.9rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              transition: "var(--transition)"
            }}
          >
            <span>📹</span> Video Lectures {parsedVideos.length > 0 && `(${parsedVideos.length})`}
          </button>
        )}
        {hasNotes && (
          <button
            type="button"
            onClick={() => setActiveTab("notes")}
            style={{
              flex: 1,
              padding: "0.85rem 1.25rem",
              background: activeTab === "notes" ? "var(--bg-card)" : "transparent",
              color: activeTab === "notes" ? "var(--primary)" : "var(--text-muted)",
              border: "none",
              borderBottom: activeTab === "notes" ? "2px solid var(--primary)" : "2px solid transparent",
              fontWeight: "600",
              fontSize: "0.9rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              transition: "var(--transition)"
            }}
          >
            <span>📄</span> Study Notes & Material {parsedNotes.length > 0 && `(${parsedNotes.length})`}
          </button>
        )}
      </div>

      {/* Media Content Body */}
      <div style={{ padding: "1.5rem" }}>
        {activeTab === "video" && hasVideos && (
          <div>
            {/* Multi-Video Folder Playlist Strip */}
            {parsedVideos.length > 1 && (
              <div style={{
                marginBottom: "1.25rem",
                padding: "0.85rem 1rem",
                backgroundColor: "var(--bg-secondary)",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-color)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>
                    Course Video Folder Playlist ({parsedVideos.length} Lessons)
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: "600" }}>
                    Playing: Lesson {selectedVideoIndex + 1}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
                  {parsedVideos.map((vid, idx) => {
                    const isCompleted = completedIndices.has(idx);
                    const isCurrent = idx === selectedVideoIndex;
                    return (
                      <button
                        key={vid.id || idx}
                        type="button"
                        onClick={() => setSelectedVideoIndex(idx)}
                        style={{
                          padding: "0.4rem 0.85rem",
                          borderRadius: "var(--radius-sm)",
                          border: isCurrent 
                            ? "1px solid var(--primary)" 
                            : isCompleted 
                              ? "1px solid rgba(46, 98, 60, 0.5)" 
                              : "1px solid var(--border-color)",
                          backgroundColor: isCurrent 
                            ? "var(--primary)" 
                            : isCompleted 
                              ? "rgba(46, 98, 60, 0.12)" 
                              : "var(--bg-card)",
                          color: isCurrent ? "#fff" : "var(--text-main)",
                          fontSize: "0.8rem",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          transition: "var(--transition)"
                        }}
                      >
                        <span>{isCompleted ? "✅" : isCurrent ? "▶️" : "🎬"}</span>
                        <span>{vid.title || vid.originalName || `Lesson ${idx + 1}`}</span>
                        {isCompleted && (
                          <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.35rem", borderRadius: "3px", backgroundColor: "rgba(46, 98, 60, 0.2)", color: isCurrent ? "#fff" : "var(--success)", fontWeight: "700" }}>
                            Done
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Video Completed Auto-Progress Toast */}
            {justCompletedIndex !== null && (
              <div style={{
                marginBottom: "1rem",
                padding: "0.75rem 1rem",
                backgroundColor: "rgba(46, 98, 60, 0.15)",
                border: "1px solid rgba(46, 98, 60, 0.4)",
                borderRadius: "var(--radius-sm)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "1.1rem" }}>🎉</span>
                  <span style={{ fontSize: "0.85rem", color: "var(--success)", fontWeight: "600" }}>
                    Lesson Completed! Your course progress has updated automatically.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setJustCompletedIndex(null)}
                  style={{ border: "none", background: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.8rem" }}
                >
                  &times;
                </button>
              </div>
            )}

            {/* Video Player */}
            {embed?.type === "iframe" && (
              <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: "var(--radius-sm)", backgroundColor: "#000" }}>
                <iframe
                  src={embed.src}
                  title={`${currentVideoTitle} - Video Lecture`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    border: "none"
                  }}
                />
              </div>
            )}

            {embed?.type === "video" && (
              <div style={{ borderRadius: "var(--radius-sm)", overflow: "hidden", backgroundColor: "#000" }}>
                <video
                  key={currentVideoUrl}
                  controls
                  preload="metadata"
                  playsInline
                  src={embed.src}
                  onEnded={() => handleVideoEnded(selectedVideoIndex)}
                  style={{ width: "100%", maxHeight: "500px", display: "block" }}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}

            {embed?.type === "generic" && (
              <div style={{
                padding: "2rem",
                textAlign: "center",
                backgroundColor: "var(--bg-secondary)",
                borderRadius: "var(--radius-sm)"
              }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🎬</div>
                <h4 style={{ marginBottom: "0.5rem" }}>{currentVideoTitle}</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
                  The video lecture for this course is ready to stream.
                </p>
                <a
                  href={currentVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
                >
                  Open Video Stream &rarr;
                </a>
              </div>
            )}

            <div style={{ marginTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", color: "var(--text-muted)" }}>
              <span>Lesson: <strong style={{ color: "var(--text-main)" }}>{currentVideoTitle}</strong></span>
              {currentVideoUrl && (
                <a href={currentVideoUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: "600" }}>
                  Open in New Tab &nearr;
                </a>
              )}
            </div>
          </div>
        )}

        {activeTab === "notes" && (
          <div>
            {/* Multiple Attached Notes Documents List */}
            {parsedNotes.length > 0 && (
              <div style={{ marginBottom: notesContent ? "2rem" : "0" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", display: "block", marginBottom: "0.75rem" }}>
                  Attached Study Material & Notes Documents ({parsedNotes.length} Files):
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {parsedNotes.map((doc, idx) => (
                    <div
                      key={doc.id || idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.85rem 1.25rem",
                        backgroundColor: "var(--bg-secondary)",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border-color)",
                        gap: "1rem"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", overflow: "hidden" }}>
                        <span style={{ fontSize: "1.4rem" }}>{getDocIcon(doc.originalName || doc.fileName)}</span>
                        <div>
                          <strong style={{ fontSize: "0.92rem", display: "block", color: "var(--text-main)" }}>
                            {doc.title || doc.originalName || `Study Document #${idx + 1}`}
                          </strong>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            {doc.originalName || doc.fileName}
                          </span>
                        </div>
                      </div>
                      <a
                        href={resolveMediaUrl(doc.fileUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", whiteSpace: "nowrap", fontSize: "0.8rem" }}
                      >
                        <span>View / Download</span> &nearr;
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Markdown Text Notes */}
            {notesContent && (
              <div style={{
                backgroundColor: "var(--bg-primary)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-sm)",
                padding: "1.5rem",
                position: "relative"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>
                    Instructor Study Notes & Reference Syllabus
                  </span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(notesContent)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: "0.75rem", padding: "0.2rem 0.6rem" }}
                  >
                    Copy Notes
                  </button>
                </div>
                <pre style={{
                  whiteSpace: "pre-wrap",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.92rem",
                  lineHeight: "1.7",
                  color: "var(--text-main)",
                  margin: 0
                }}>
                  {notesContent}
                </pre>
              </div>
            )}

            {parsedNotes.length === 0 && !notesContent && (
              <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                No study notes have been attached to this course yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseMediaViewer;
