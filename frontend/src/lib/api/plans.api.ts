import api from "./axios.instance";
import { Plan } from "@/types/plan.types";
import { ApiResponse } from "@/types/api.types";

export const plansApi = {
  getAll: async (): Promise<ApiResponse<Plan[]>> => {
    const response = await api.get("/plans");
    return response.data;
  },

  getActive: async (): Promise<ApiResponse<Plan[]>> => {
    const response = await api.get("/plans/active");
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Plan>> => {
    const response = await api.get(`/plans/${id}`);
    return response.data;
  },

  create: async (data: unknown): Promise<ApiResponse<Plan>> => {
    const response = await api.post("/plans", data);
    return response.data;
  },

  update: async (id: string, data: unknown): Promise<ApiResponse<Plan>> => {
    const response = await api.put(`/plans/${id}`, data);
    return response.data;
  },

  toggle: async (id: string, isActive: boolean): Promise<ApiResponse<Plan>> => {
    const response = await api.patch(`/plans/${id}/toggle`, { isActive });
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/plans/${id}`);
    return response.data;
  },
};