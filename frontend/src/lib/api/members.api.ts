import api from "./axios.instance";

export const membersApi = {
  getAll: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    planId?: string;
    status?: string;
    hasPending?: boolean;
    fullyPaid?: boolean;
  } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    if (params.search) query.set("search", params.search);
    if (params.planId) query.set("planId", params.planId);
    if (params.status) query.set("status", params.status);
    if (params.hasPending) query.set("hasPending", "true");
    if (params.fullyPaid) query.set("fullyPaid", "true");
    const response = await api.get(`/members?${query.toString()}`);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/members/${id}`);
    return response.data;
  },

  create: async (data: Record<string, unknown>) => {
    const response = await api.post("/members", data);
    return response.data;
  },

  update: async (id: string, data: Record<string, unknown>) => {
    const response = await api.put(`/members/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/members/${id}`);
    return response.data;
  },

  addPayment: async (
    id: string,
    data: { amount: number; paidOn: string; note?: string }
  ) => {
    const response = await api.post(`/members/${id}/payment`, data);
    return response.data;
  },

  renew: async (
    id: string,
    data: {
      planId?: string;
      slotId?: string;
      startDate: string;
      finalPrice?: number;
      initialPayment?: number;
    }
  ) => {
    const response = await api.post(`/members/${id}/renew`, data);
    return response.data;
  },

  endMembership: async (
    id: string,
    data: {
      effectiveEndDate: string;
      settlementDeduction?: number;
      note?: string;
    }
  ) => {
    const response = await api.post(`/members/${id}/end`, data);
    return response.data;
  },

  revertEndMembership: async (id: string) => {
    const response = await api.post(`/members/${id}/revert-end`, {});
    return response.data;
  },
};
