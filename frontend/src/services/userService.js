import API from "./api";

const userService = {
  getProfile: async () => {
    const response = await API.get("/api/users/profile");
    return response.data;
  },

  getAllUsers: async () => {
    const response = await API.get("/api/users");
    return response.data;
  },
};

export default userService;
