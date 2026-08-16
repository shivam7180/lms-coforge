import API from "./api";

const authService = {
  register: async (fullName, email, password, role, bio) => {
    const response = await API.post("/api/auth/register", {
      fullName,
      email,
      password,
      role,
      bio,
    });
    if (response.data && response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data));
    }
    return response.data;
  },

  login: async (email, password) => {
    const response = await API.post("/api/auth/login", { email, password });
    if (response.data && response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        return null;
      }
    }
    return null;
  },

  getToken: () => {
    return localStorage.getItem("token");
  },
};

export default authService;
