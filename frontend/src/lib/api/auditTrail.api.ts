import api from "./axios.instance";

export const auditTrailApi = {
  getAll: async (params: {
    page?: number;
    limit?: number;
    module?: string;
    action?: string;
    actorRole?: string;
    search?: string;
  } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    if (params.module) query.set("module", params.module);
    if (params.action) query.set("action", params.action);
    if (params.actorRole) query.set("actorRole", params.actorRole);
    if (params.search) query.set("search", params.search);

    const response = await api.get(`/audit-trail?${query.toString()}`);
    return response.data;
  },
};
