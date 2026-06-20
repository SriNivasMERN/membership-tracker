import api from "./axios.instance";
import { Plan, PlanFormData } from "@/types/plan.types";

type PlansResponse = { success: boolean; data: Plan[] };

let cachedAllPlans: Plan[] | null = null;
let cachedActivePlans: Plan[] | null = null;
let allPlansPromise: Promise<PlansResponse> | null = null;
let activePlansPromise: Promise<PlansResponse> | null = null;

const invalidatePlansCache = () => {
  cachedAllPlans = null;
  cachedActivePlans = null;
  allPlansPromise = null;
  activePlansPromise = null;
};

export const plansApi = {
  getAll: async ({ force = false }: { force?: boolean } = {}) => {
    if (!force && cachedAllPlans) {
      return { success: true, data: cachedAllPlans };
    }

    if (!force && allPlansPromise) {
      return allPlansPromise;
    }

    allPlansPromise = api.get("/plans").then((response) => {
      cachedAllPlans = response.data.data || [];
      return response.data;
    }).finally(() => {
      allPlansPromise = null;
    });

    return allPlansPromise;
  },

  getActive: async ({ force = false }: { force?: boolean } = {}) => {
    if (!force && cachedActivePlans) {
      return { success: true, data: cachedActivePlans };
    }

    if (!force && activePlansPromise) {
      return activePlansPromise;
    }

    activePlansPromise = api.get("/plans/active").then((response) => {
      cachedActivePlans = response.data.data || [];
      return response.data;
    }).finally(() => {
      activePlansPromise = null;
    });

    return activePlansPromise;
  },

  create: async (data: PlanFormData) => {
    const response = await api.post("/plans", data);
    invalidatePlansCache();
    return response.data;
  },

  update: async (id: string, data: Partial<PlanFormData>) => {
    const response = await api.put(`/plans/${id}`, data);
    invalidatePlansCache();
    return response.data;
  },

  // Backend requires { isActive: boolean } in body - pass the NEW state
  toggle: async (id: string, currentIsActive: boolean) => {
    const response = await api.patch(`/plans/${id}/toggle`, {
      isActive: !currentIsActive,
    });
    invalidatePlansCache();
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/plans/${id}`);
    invalidatePlansCache();
    return response.data;
  },

  clearCache: invalidatePlansCache,
};
