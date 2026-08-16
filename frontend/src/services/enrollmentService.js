import API from "./api";

const enrollmentService = {
  createEnrollment: async (courseId) => {
    const response = await API.post("/api/enrollments", { courseId });
    return response.data;
  },

  getEnrollmentById: async (id) => {
    const response = await API.get(`/api/enrollments/${id}`);
    return response.data;
  },

  getEnrollmentsByStudent: async (studentId) => {
    const response = await API.get(`/api/enrollments/student/${studentId}`);
    return response.data;
  },

  getEnrollmentsByCourse: async (courseId) => {
    const response = await API.get(`/api/enrollments/course/${courseId}`);
    return response.data;
  },

  updateProgress: async (id, progressPercentage) => {
    const response = await API.put(`/api/enrollments/${id}/progress`, {
      progressPercentage,
    });
    return response.data;
  },

  cancelEnrollment: async (id) => {
    const response = await API.put(`/api/enrollments/${id}/cancel`);
    return response.data;
  },
};

export default enrollmentService;
