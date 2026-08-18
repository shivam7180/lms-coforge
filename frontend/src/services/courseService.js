import API from "./api";

const courseService = {
  createCourse: async (courseData) => {
    const response = await API.post("/api/courses", courseData);
    return response.data;
  },

  getAllCourses: async () => {
    const response = await API.get("/api/courses");
    return response.data;
  },

  getCourseById: async (id) => {
    const response = await API.get(`/api/courses/${id}`);
    return response.data;
  },

  getPublishedCourses: async () => {
    const response = await API.get("/api/courses/published");
    return response.data;
  },

  getCoursesByInstructor: async (instructorId) => {
    const response = await API.get(`/api/courses/instructor/${instructorId}`);
    return response.data;
  },

  updateCourse: async (id, courseData) => {
    const response = await API.put(`/api/courses/${id}`, courseData);
    return response.data;
  },

  deleteCourse: async (id) => {
    const response = await API.delete(`/api/courses/${id}`);
    return response.data;
  },

  publishCourse: async (id) => {
    const response = await API.put(`/api/courses/${id}/publish`);
    return response.data;
  },

  uploadFile: async (file, type = "general", onProgress = null) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    const response = await API.post("/api/courses/upload", formData, {
      headers: {
        "Content-Type": undefined,
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return response.data;
  },

  uploadMultipleFiles: async (files, type = "general", onProgress = null) => {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }
    formData.append("type", type);
    const response = await API.post("/api/courses/upload-multiple", formData, {
      headers: {
        "Content-Type": undefined,
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return response.data;
  },
};

export default courseService;
