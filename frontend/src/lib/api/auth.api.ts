import api from "./axios.instance";

export const authApi = {
  logout: async () => {
    const response = await api.post("/auth/logout");
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get("/users/me");
    return response.data;
  },
};