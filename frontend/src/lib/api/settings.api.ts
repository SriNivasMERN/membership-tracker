import api from "./axios.instance";
import { BusinessSettings } from "@/types/settings.types";
import { ApiResponse } from "@/types/api.types";

export const settingsApi = {
  getSettings: async (): Promise<ApiResponse<BusinessSettings>> => {
    const response = await api.get("/settings");
    return response.data;
  },

  saveSettings: async (data: Partial<BusinessSettings>) => {
    const response = await api.post("/settings", data);
    return response.data;
  },

  updateSettings: async (data: Partial<BusinessSettings>) => {
    const response = await api.put("/settings", data);
    return response.data;
  },
};