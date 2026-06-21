import api from "./axios.instance";
import { dashboardApi } from "./dashboard.api";
import { Member } from "@/types/member.types";

type MembersResponse = {
  success: boolean;
  data: Member[];
  pagination?: unknown;
};

const membersCache = new Map<string, MembersResponse>();
const membersPromiseCache = new Map<string, Promise<MembersResponse>>();

const clearMembersCache = () => {
  membersCache.clear();
  membersPromiseCache.clear();
};

export const membersApi = {
  getAll: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    planId?: string;
    status?: string;
    hasPending?: boolean;
    fullyPaid?: boolean;
  } = {}, { force = false }: { force?: boolean } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    if (params.search) query.set("search", params.search);
    if (params.planId) query.set("planId", params.planId);
    if (params.status) query.set("status", params.status);
    if (params.hasPending) query.set("hasPending", "true");
    if (params.fullyPaid) query.set("fullyPaid", "true");
    const cacheKey = query.toString();

    if (!force && membersCache.has(cacheKey)) {
      return membersCache.get(cacheKey)!;
    }

    if (!force && membersPromiseCache.has(cacheKey)) {
      return membersPromiseCache.get(cacheKey)!;
    }

    const request = api.get(`/members?${cacheKey}`).then((response) => {
      membersCache.set(cacheKey, response.data);
      return response.data;
    }).finally(() => {
      membersPromiseCache.delete(cacheKey);
    });

    membersPromiseCache.set(cacheKey, request);
    return request;
  },

  getById: async (id: string) => {
    const response = await api.get(`/members/${id}`);
    return response.data;
  },

  create: async (data: Record<string, unknown>) => {
    const response = await api.post("/members", data);
    clearMembersCache();
    dashboardApi.clearCache();
    return response.data;
  },

  update: async (id: string, data: Record<string, unknown>) => {
    const response = await api.put(`/members/${id}`, data);
    clearMembersCache();
    dashboardApi.clearCache();
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/members/${id}`);
    clearMembersCache();
    dashboardApi.clearCache();
    return response.data;
  },

  addPayment: async (
    id: string,
    data: { amount: number; paidOn: string; paymentMethod: "cash" | "upi" | "card"; note?: string }
  ) => {
    const response = await api.post(`/members/${id}/payment`, data);
    clearMembersCache();
    dashboardApi.clearCache();
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
      initialPaymentMethod?: "cash" | "upi" | "card";
    }
  ) => {
    const response = await api.post(`/members/${id}/renew`, data);
    clearMembersCache();
    dashboardApi.clearCache();
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
    clearMembersCache();
    dashboardApi.clearCache();
    return response.data;
  },

  revertEndMembership: async (id: string) => {
    const response = await api.post(`/members/${id}/revert-end`, {});
    clearMembersCache();
    dashboardApi.clearCache();
    return response.data;
  },

  clearCache: clearMembersCache,
};
