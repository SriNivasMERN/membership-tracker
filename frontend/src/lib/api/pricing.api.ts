import api from "./axios.instance";

export interface PricingRuleFormData {
  planId: string;
  slotId: string;
  multiplier: number;
  isActive?: boolean;
}

interface PopulatedPlan {
  _id: string;
  name: string;
  basePrice: number;
  isActive: boolean;
}

interface PopulatedSlot {
  _id: string;
  label: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface PricingRule {
  _id: string;
  planId: PopulatedPlan;
  slotId: PopulatedSlot;
  multiplier: number;
  isActive: boolean;
  createdAt: string;
}

type PricingRulesResponse = {
  success: boolean;
  data: PricingRule[];
};

let cachedPricingRules: PricingRule[] | null = null;
let pricingRulesPromise: Promise<PricingRulesResponse> | null = null;

const clearPricingCache = () => {
  cachedPricingRules = null;
  pricingRulesPromise = null;
};

export const pricingApi = {
  getAll: async ({ force = false }: { force?: boolean } = {}) => {
    if (!force && cachedPricingRules) {
      return { success: true, data: cachedPricingRules };
    }

    if (!force && pricingRulesPromise) {
      return pricingRulesPromise;
    }

    pricingRulesPromise = api.get("/pricing").then((response) => {
      cachedPricingRules = response.data.data || [];
      return response.data;
    }).finally(() => {
      pricingRulesPromise = null;
    });

    return pricingRulesPromise;
  },

  create: async (data: PricingRuleFormData) => {
    const response = await api.post("/pricing", data);
    clearPricingCache();
    return response.data;
  },

  update: async (id: string, data: { multiplier?: number; isActive?: boolean }) => {
    const response = await api.put(`/pricing/${id}`, data);
    clearPricingCache();
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/pricing/${id}`);
    clearPricingCache();
    return response.data;
  },

  calculate: async (planId: string, slotId: string) => {
    const response = await api.post("/pricing/calculate", { planId, slotId });
    return response.data;
  },

  clearCache: clearPricingCache,
};
