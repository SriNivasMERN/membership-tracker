import api from "./axios.instance";
import { Slot, SlotFormData } from "@/types/slot.types";

type SlotsResponse = { success: boolean; data: Slot[] };

let cachedAllSlots: Slot[] | null = null;
let cachedActiveSlots: Slot[] | null = null;
let allSlotsPromise: Promise<SlotsResponse> | null = null;
let activeSlotsPromise: Promise<SlotsResponse> | null = null;

const invalidateSlotsCache = () => {
  cachedAllSlots = null;
  cachedActiveSlots = null;
  allSlotsPromise = null;
  activeSlotsPromise = null;
};

export const slotsApi = {
  getAll: async ({ force = false }: { force?: boolean } = {}) => {
    if (!force && cachedAllSlots) {
      return { success: true, data: cachedAllSlots };
    }

    if (!force && allSlotsPromise) {
      return allSlotsPromise;
    }

    allSlotsPromise = api.get("/slots").then((response) => {
      cachedAllSlots = response.data.data || [];
      return response.data;
    }).finally(() => {
      allSlotsPromise = null;
    });

    return allSlotsPromise;
  },

  getActive: async ({ force = false }: { force?: boolean } = {}) => {
    if (!force && cachedActiveSlots) {
      return { success: true, data: cachedActiveSlots };
    }

    if (!force && activeSlotsPromise) {
      return activeSlotsPromise;
    }

    activeSlotsPromise = api.get("/slots/active").then((response) => {
      cachedActiveSlots = response.data.data || [];
      return response.data;
    }).finally(() => {
      activeSlotsPromise = null;
    });

    return activeSlotsPromise;
  },

  create: async (data: SlotFormData) => {
    const response = await api.post("/slots", data);
    invalidateSlotsCache();
    return response.data;
  },

  update: async (id: string, data: Partial<SlotFormData>) => {
    const response = await api.put(`/slots/${id}`, data);
    invalidateSlotsCache();
    return response.data;
  },

  toggle: async (id: string, currentIsActive: boolean) => {
    const response = await api.patch(`/slots/${id}/toggle`, {
      isActive: !currentIsActive,
    });
    invalidateSlotsCache();
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/slots/${id}`);
    invalidateSlotsCache();
    return response.data;
  },

  clearCache: invalidateSlotsCache,
};
