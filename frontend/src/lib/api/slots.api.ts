import api from "./axios.instance";
import { SlotFormData } from "@/types/slot.types";

export const slotsApi = {
  getAll: async () => {
    const response = await api.get("/slots");
    return response.data;
  },

  getActive: async () => {
    const response = await api.get("/slots/active");
    return response.data;
  },

  create: async (data: SlotFormData) => {
    const response = await api.post("/slots", data);
    return response.data;
  },

  update: async (id: string, data: Partial<SlotFormData>) => {
    const response = await api.put(`/slots/${id}`, data);
    return response.data;
  },

  toggle: async (id: string, currentIsActive: boolean) => {
    const response = await api.patch(`/slots/${id}/toggle`, {
      isActive: !currentIsActive,
    });
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/slots/${id}`);
    return response.data;
  },
};