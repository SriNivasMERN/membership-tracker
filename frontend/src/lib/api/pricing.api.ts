import api from "./axios.instance";
import { ApiResponse } from "@/types/api.types";

export const pricingApi = {
  calculatePrice: async (data: {
    planId: string;
    slotId: string;
    basePrice: number;
  }): Promise<ApiResponse<{ finalPrice: number }>> => {
    const response = await api.post("/pricing/calculate", data);
    return response.data;
  },

  getAll: async () => {
    const response = await api.get("/pricing");
    return response.data;
  },

  create: async (data: unknown) => {
    const response = await api.post("/pricing", data);
    return response.data;
  },

  update: async (id: string, data: unknown) => {
    const response = await api.put(`/pricing/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/pricing/${id}`);
    return response.data;
  },
};