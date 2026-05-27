import api from "./axios.instance";
import { Member } from "@/types/member.types";
import { ApiResponse } from "@/types/api.types";

export const membersApi = {
  getAll: async (params: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<Member[]>> => {
    const response = await api.get("/members", { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Member>> => {
    const response = await api.get(`/members/${id}`);
    return response.data;
  },

  create: async (data: unknown): Promise<ApiResponse<Member>> => {
    const response = await api.post("/members", data);
    return response.data;
  },

  update: async (
    id: string,
    data: unknown
  ): Promise<ApiResponse<Member>> => {
    const response = await api.put(`/members/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/members/${id}`);
    return response.data;
  },

  addPayment: async (
    id: string,
    data: unknown
  ): Promise<ApiResponse<Member>> => {
    const response = await api.post(`/members/${id}/payment`, data);
    return response.data;
  },

  renew: async (
    id: string,
    data: unknown
  ): Promise<ApiResponse<Member>> => {
    const response = await api.post(`/members/${id}/renew`, data);
    return response.data;
  },
};