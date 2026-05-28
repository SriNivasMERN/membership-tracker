import api from "./axios.instance";

export const dashboardApi = {
  getSummary: async () => {
    const response = await api.get("/dashboard");
    return response.data;
  },

  getMonthlyRevenue: async () => {
    const response = await api.get("/dashboard/monthly-revenue");
    return response.data;
  },

  getPlanDistribution: async () => {
    const response = await api.get("/dashboard/plan-distribution");
    return response.data;
  },
};