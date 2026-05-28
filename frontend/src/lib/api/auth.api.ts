import api from "./axios.instance";

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },

  logout: async () => {
    const response = await api.post("/auth/logout");
    return response.data;
  },

  refresh: async () => {
    const response = await api.post("/auth/refresh");
    return response.data;
  },

  me: async () => {
    const response = await api.get("/users/me");
    return response.data;
  },
};