import api from "./axios.instance";

export interface SettingsFormData {
  businessName: string;
  businessType: string;
  email?: string;
  phone?: string;
  address?: string;
  expiryAlertDays: number;
  terminology: {
    planLabel: string;
    slotLabel: string;
    memberLabel: string;
  };
}

export const settingsApi = {
  get: async () => {
    const response = await api.get("/settings");
    return response.data;
  },

  save: async (data: SettingsFormData) => {
    const response = await api.post("/settings", data);
    return response.data;
  },

  update: async (data: Partial<SettingsFormData>) => {
    const response = await api.put("/settings", data);
    return response.data;
  },
};