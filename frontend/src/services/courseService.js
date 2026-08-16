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
};

export default courseService;
