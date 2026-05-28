import api from "./axios.instance";
import { PlanFormData } from "@/types/plan.types";

export const plansApi = {
  getAll: async () => {
    const response = await api.get("/plans");
    return response.data;
  },

  getActive: async () => {
    const response = await api.get("/plans/active");
    return response.data;
  },

  create: async (data: PlanFormData) => {
    const response = await api.post("/plans", data);
    return response.data;
  },

  update: async (id: string, data: Partial<PlanFormData>) => {
    const response = await api.put(`/plans/${id}`, data);
    return response.data;
  },

  // Backend requires { isActive: boolean } in body - pass the NEW state
  toggle: async (id: string, currentIsActive: boolean) => {
    const response = await api.patch(`/plans/${id}/toggle`, {
      isActive: !currentIsActive,
    });
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/plans/${id}`);
    return response.data;
  },
};