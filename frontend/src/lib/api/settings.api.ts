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

type SettingsResponse = {
  success?: boolean;
  data: Partial<SettingsFormData> & {
    isConfigured?: boolean;
    updatedAt?: string;
  };
};

let cachedSettings: SettingsResponse | null = null;
let settingsPromise: Promise<SettingsResponse> | null = null;

const clearSettingsCache = () => {
  cachedSettings = null;
  settingsPromise = null;
};

export const settingsApi = {
  get: async ({ force = false }: { force?: boolean } = {}) => {
    if (!force && cachedSettings) {
      return cachedSettings;
    }

    if (!force && settingsPromise) {
      return settingsPromise;
    }

    settingsPromise = api.get("/settings").then((response) => {
      cachedSettings = response.data;
      return response.data;
    }).finally(() => {
      settingsPromise = null;
    });

    return settingsPromise;
  },

  save: async (data: SettingsFormData) => {
    const response = await api.post("/settings", data);
    clearSettingsCache();
    return response.data;
  },

  update: async (data: Partial<SettingsFormData>) => {
    const response = await api.put("/settings", data);
    clearSettingsCache();
    return response.data;
  },

  clearCache: clearSettingsCache,
};
