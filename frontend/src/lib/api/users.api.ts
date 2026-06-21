import api from "./axios.instance";

interface StaffUser {
  _id: string;
  name: string;
  email: string;
  role: "owner" | "staff";
  isActive: boolean;
  createdAt: string;
}

type UsersResponse = {
  success: boolean;
  data: StaffUser[];
};

let cachedUsers: StaffUser[] | null = null;
let usersPromise: Promise<UsersResponse> | null = null;

const clearUsersCache = () => {
  cachedUsers = null;
  usersPromise = null;
};

export const usersApi = {
  getAll: async ({ force = false }: { force?: boolean } = {}) => {
    if (!force && cachedUsers) {
      return { success: true, data: cachedUsers };
    }

    if (!force && usersPromise) {
      return usersPromise;
    }

    usersPromise = api.get("/users").then((response) => {
      cachedUsers = response.data.data || [];
      return response.data;
    }).finally(() => {
      usersPromise = null;
    });

    return usersPromise;
  },

  create: async (data: {
    name: string;
    email: string;
    password: string;
    role: "staff";
  }) => {
    const response = await api.post("/users", data);
    clearUsersCache();
    return response.data;
  },

  update: async (id: string, data: { name: string }) => {
    const response = await api.put(`/users/${id}`, data);
    clearUsersCache();
    return response.data;
  },

  updateCredentials: async (
    id: string,
    data: { email?: string; newPassword?: string }
  ) => {
    const response = await api.patch(`/users/${id}/credentials`, data);
    clearUsersCache();
    return response.data;
  },

  toggle: async (id: string, currentIsActive: boolean) => {
    const response = await api.patch(`/users/${id}/toggle`, {
      isActive: !currentIsActive,
    });
    clearUsersCache();
    return response.data;
  },

  clearCache: clearUsersCache,
};
