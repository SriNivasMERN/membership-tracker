import api from "./axios.instance";

export interface PricingRuleFormData {
  planId: string;
  slotId: string;
  multiplier: number;
  isActive?: boolean;
}

export const pricingApi = {
  getAll: async () => {
    const response = await api.get("/pricing");
    return response.data;
  },

  create: async (data: PricingRuleFormData) => {
    const response = await api.post("/pricing", data);
    return response.data;
  },

  update: async (id: string, data: { multiplier?: number; isActive?: boolean }) => {
    const response = await api.put(`/pricing/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/pricing/${id}`);
    return response.data;
  },

  calculate: async (planId: string, slotId: string) => {
    const response = await api.post("/pricing/calculate", { planId, slotId });
    return response.data;
  },
};