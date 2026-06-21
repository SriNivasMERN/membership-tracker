import api from "./axios.instance";

interface MemberCounts {
  total: number;
  active: number;
  expiringSoon: number;
  expired: number;
}

interface Revenue {
  totalRevenue: number;
  totalPending: number;
}

interface ExpiryAlert {
  memberId: string;
  name: string;
  mobile: string;
  endDate: string;
  planName: string;
  slotLabel: string;
  pendingAmount: number;
}

interface SlotActivity {
  label: string;
  count: number;
}

interface DashboardData {
  memberCounts: MemberCounts;
  revenue: Revenue;
  expiryAlerts: ExpiryAlert[];
  slotActivity: SlotActivity[];
}

interface MonthlyRevenue {
  year: number;
  month: number;
  totalAmount: number;
  paymentCount: number;
}

interface PlanDistribution {
  planId: string;
  planName: string;
  memberCount: number;
}

type DashboardResponse<T> = {
  success?: boolean;
  data: T;
};

let cachedSummary: DashboardResponse<DashboardData> | null = null;
let cachedMonthlyRevenue: DashboardResponse<MonthlyRevenue[]> | null = null;
let cachedPlanDistribution: DashboardResponse<PlanDistribution[]> | null = null;
let summaryPromise: Promise<DashboardResponse<DashboardData>> | null = null;
let monthlyRevenuePromise: Promise<DashboardResponse<MonthlyRevenue[]>> | null = null;
let planDistributionPromise: Promise<DashboardResponse<PlanDistribution[]>> | null = null;

const clearDashboardCache = () => {
  cachedSummary = null;
  cachedMonthlyRevenue = null;
  cachedPlanDistribution = null;
  summaryPromise = null;
  monthlyRevenuePromise = null;
  planDistributionPromise = null;
};

export const dashboardApi = {
  getSummary: async ({ force = false }: { force?: boolean } = {}) => {
    if (!force && cachedSummary) {
      return cachedSummary;
    }

    if (!force && summaryPromise) {
      return summaryPromise;
    }

    summaryPromise = api.get("/dashboard").then((response) => {
      cachedSummary = response.data;
      return response.data;
    }).finally(() => {
      summaryPromise = null;
    });

    return summaryPromise;
  },

  getMonthlyRevenue: async ({ force = false }: { force?: boolean } = {}) => {
    if (!force && cachedMonthlyRevenue) {
      return cachedMonthlyRevenue;
    }

    if (!force && monthlyRevenuePromise) {
      return monthlyRevenuePromise;
    }

    monthlyRevenuePromise = api.get("/dashboard/monthly-revenue").then((response) => {
      cachedMonthlyRevenue = response.data;
      return response.data;
    }).finally(() => {
      monthlyRevenuePromise = null;
    });

    return monthlyRevenuePromise;
  },

  getPlanDistribution: async ({ force = false }: { force?: boolean } = {}) => {
    if (!force && cachedPlanDistribution) {
      return cachedPlanDistribution;
    }

    if (!force && planDistributionPromise) {
      return planDistributionPromise;
    }

    planDistributionPromise = api.get("/dashboard/plan-distribution").then((response) => {
      cachedPlanDistribution = response.data;
      return response.data;
    }).finally(() => {
      planDistributionPromise = null;
    });

    return planDistributionPromise;
  },

  clearCache: clearDashboardCache,
};
