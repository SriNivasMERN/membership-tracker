import api from "./axios.instance";
import { Slot } from "@/types/slot.types";
import { ApiResponse } from "@/types/api.types";

export const slotsApi = {
  getAll: async (): Promise<ApiResponse<Slot[]>> => {
    const response = await api.get("/slots");
    return response.data;
  },

  getActive: async (): Promise<ApiResponse<Slot[]>> => {
    const response = await api.get("/slots/active");
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Slot>> => {
    const response = await api.get(`/slots/${id}`);
    return response.data;
  },

  create: async (data: unknown): Promise<ApiResponse<Slot>> => {
    const response = await api.post("/slots", data);
    return response.data;
  },

  update: async (id: string, data: unknown): Promise<ApiResponse<Slot>> => {
    const response = await api.put(`/slots/${id}`, data);
    return response.data;
  },

  toggle: async (id: string, isActive: boolean): Promise<ApiResponse<Slot>> => {
    const response = await api.patch(`/slots/${id}/toggle`, { isActive });
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/slots/${id}`);
    return response.data;
  },
};