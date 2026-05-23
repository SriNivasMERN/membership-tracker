import mongoose from "mongoose";
import { Member } from "../members/member.model";
import { BusinessSettings } from "../settings/settings.model";
import {
  deriveMemberStatus,
  calculatePaidAmount,
  calculatePendingAmount,
} from "../../utils/date.utils";

export const dashboardService = {

  async getDashboardData(businessId: string) {
    const bizId = new mongoose.Types.ObjectId(businessId);

    // Get expiry alert days from settings
    const settings = await BusinessSettings.findOne({
      businessId: bizId,
    });
    const expiryAlertDays = settings?.expiryAlertDays ?? 7;

    // Fetch all non-deleted members
    const members = await Member.find({
      businessId: bizId,
      isDeleted: false,
    });

    // Initialize counters
    let activeCount = 0;
    let expiringSoonCount = 0;
    let expiredCount = 0;
    let totalRevenue = 0;
    let totalPending = 0;
    const expiryAlerts: object[] = [];
    const slotActivity: Record<string, { label: string; count: number }> = {};
    let fullyPaidCount = 0;
    let partialCount = 0;
    let unpaidCount = 0;

    // Process each member
    for (const member of members) {
      const status = deriveMemberStatus(
        member.startDate,
        member.endDate,
        expiryAlertDays
      );

      const paidAmount = calculatePaidAmount(member.payments);
      const pendingAmount = calculatePendingAmount(
        member.finalPrice,
        member.payments
      );

      // Member counts by status
      if (status === "active") activeCount++;
      else if (status === "expiring_soon") expiringSoonCount++;
      else if (status === "expired") expiredCount++;

      // Revenue - only fully paid members
      if (pendingAmount <= 0) {
        totalRevenue += member.finalPrice;
        fullyPaidCount++;
      } else if (paidAmount > 0) {
        partialCount++;
      } else {
        unpaidCount++;
      }

      // Total pending across all members
      if (pendingAmount > 0) {
        totalPending += pendingAmount;
      }

      // Expiry alerts - members expiring soon
      if (status === "expiring_soon") {
        expiryAlerts.push({
          memberId: member._id,
          name: member.name,
          mobile: member.mobile,
          endDate: member.endDate,
          planName: member.planSnapshot.name,
          slotLabel: member.slotSnapshot.label,
          pendingAmount,
        });
      }

      // Slot activity - count members per slot
      const slotId = member.slotSnapshot.slotId.toString();
      const slotLabel = member.slotSnapshot.label;

      if (!slotActivity[slotId]) {
        slotActivity[slotId] = { label: slotLabel, count: 0 };
      }
      slotActivity[slotId].count++;
    }

    return {
      memberCounts: {
        total: members.length,
        active: activeCount,
        expiringSoon: expiringSoonCount,
        expired: expiredCount,
      },
      revenue: {
        totalRevenue,
        totalPending,
      },
      paymentStatus: {
        fullyPaid: fullyPaidCount,
        partial: partialCount,
        unpaid: unpaidCount,
      },
      expiryAlerts,
      slotActivity: Object.values(slotActivity),
    };
  },

  // Monthly revenue for chart - last 6 months
  async getMonthlyRevenue(businessId: string) {
    const bizId = new mongoose.Types.ObjectId(businessId);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Aggregate payments by month
    const result = await Member.aggregate([
      {
        $match: {
          businessId: bizId,
          isDeleted: false,
        },
      },
      {
        $unwind: "$payments",
      },
      {
        $match: {
          "payments.paidOn": { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$payments.paidOn" },
            month: { $month: "$payments.paidOn" },
          },
          totalAmount: { $sum: "$payments.amount" },
          paymentCount: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ]);

    return result.map((item) => ({
      year: item._id.year,
      month: item._id.month,
      totalAmount: item.totalAmount,
      paymentCount: item.paymentCount,
    }));
  },

  // Plan distribution - how many members per plan
  async getPlanDistribution(businessId: string) {
    const bizId = new mongoose.Types.ObjectId(businessId);

    const result = await Member.aggregate([
      {
        $match: {
          businessId: bizId,
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: "$planSnapshot.planId",
          planName: { $first: "$planSnapshot.name" },
          memberCount: { $sum: 1 },
        },
      },
      {
        $sort: { memberCount: -1 },
      },
    ]);

    return result.map((item) => ({
      planId: item._id,
      planName: item.planName,
      memberCount: item.memberCount,
    }));
  },
};