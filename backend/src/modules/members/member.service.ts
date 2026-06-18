import mongoose from "mongoose";
import { Member, IMemberDocument } from "./member.model";
import { Plan } from "../plans/plan.model";
import { Slot } from "../slots/slot.model";
import { BusinessSettings } from "../settings/settings.model";
import { pricingService } from "../pricing/pricing.service";
import { AppError } from "../../middleware/error.middleware";
import {
  calculateEndDate,
  deriveMemberStatus,
  calculatePaidAmount,
  calculatePendingAmount,
} from "../../utils/date.utils";
import {
  CreateMemberInput,
  UpdateMemberInput,
  AddPaymentInput,
  RenewMemberInput,
  EndMembershipInput,
  RevertEndMembershipInput,
} from "./member.schema";

const getExpiryAlertDays = async (businessId: string): Promise<number> => {
  const settings = await BusinessSettings.findOne({
    businessId: new mongoose.Types.ObjectId(businessId),
  });
  return settings?.expiryAlertDays ?? 7;
};

export const attachComputedFields = (
  member: IMemberDocument,
  expiryAlertDays: number
) => {
  const paidAmount = calculatePaidAmount(member.payments);
  const pendingAmount = member.membershipClosure
    ? member.membershipClosure.payableBalance
    : calculatePendingAmount(member.finalPrice, member.payments);
  const status = member.membershipClosure
    ? "ended"
    : deriveMemberStatus(member.startDate, member.endDate, expiryAlertDays);
  return { ...member.toObject(), paidAmount, pendingAmount, status };
};

export const memberService = {

  async createMember(
    businessId: string,
    userId: string,
    input: CreateMemberInput
  ): Promise<IMemberDocument> {
    const existingMobile = await Member.findOne({
      businessId: new mongoose.Types.ObjectId(businessId),
      mobile: input.mobile,
      isDeleted: false,
    });

    if (existingMobile) {
      throw new AppError("A member with this mobile number already exists", 409);
    }

    const plan = await Plan.findOne({
      _id: new mongoose.Types.ObjectId(input.planId),
      businessId: new mongoose.Types.ObjectId(businessId),
      isActive: true,
      isDeleted: false,
    });

    if (!plan) throw new AppError("Plan not found or is not active", 404);

    const slot = await Slot.findOne({
      _id: new mongoose.Types.ObjectId(input.slotId),
      businessId: new mongoose.Types.ObjectId(businessId),
      isActive: true,
      isDeleted: false,
    });

    if (!slot) throw new AppError("Slot not found or is not active", 404);

    let finalPrice: number;
    if (input.finalPrice !== undefined) {
      finalPrice = input.finalPrice;
    } else {
      finalPrice = await pricingService.calculateFinalPrice(
        businessId, input.planId, input.slotId, plan.basePrice
      );
    }

    const endDate = calculateEndDate(input.startDate, plan.durationDays);
    const payments = [];

    if (input.initialPayment && input.initialPayment > 0) {
      payments.push({
        amount: input.initialPayment,
        paidOn: new Date(),
        paymentMethod: input.initialPaymentMethod,
        note: "Initial payment",
        recordedBy: new mongoose.Types.ObjectId(userId),
      });
    }

    const member = await Member.create({
      businessId: new mongoose.Types.ObjectId(businessId),
      name: input.name,
      mobile: input.mobile,
      email: input.email,
      photo: input.photo,
      planSnapshot: {
        planId: plan._id,
        name: plan.name,
        durationDays: plan.durationDays,
        basePrice: plan.basePrice,
      },
      slotSnapshot: {
        slotId: slot._id,
        label: slot.label,
        startTime: slot.startTime,
        endTime: slot.endTime,
      },
      startDate: new Date(input.startDate),
      endDate,
      finalPrice,
      creditBalance: 0,
      payments,
      notes: input.notes,
      createdBy: new mongoose.Types.ObjectId(userId),
      updatedBy: new mongoose.Types.ObjectId(userId),
    });

    const expiryAlertDays = await getExpiryAlertDays(businessId);
    return attachComputedFields(member, expiryAlertDays) as unknown as IMemberDocument;
  },

  async listMembers(
    businessId: string,
    options: {
      page: number;
      limit: number;
      search?: string;
      planId?: string;
      status?: string;
      hasPending?: boolean;
      fullyPaid?: boolean;
    }
  ) {
    const { page, limit, search, planId } = options;

    const query: Record<string, unknown> = {
      businessId: new mongoose.Types.ObjectId(businessId),
      isDeleted: false,
    };

    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { mobile: { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (planId) {
      query["planSnapshot.planId"] = new mongoose.Types.ObjectId(planId);
    }

    const allMembers = await Member.find(query).sort({ createdAt: -1 });

    const expiryAlertDays = await getExpiryAlertDays(businessId);

    const overallMembersWithStatus = allMembers.map((member) =>
      attachComputedFields(member, expiryAlertDays)
    );

    let filteredMembers = overallMembersWithStatus;

    if (options.status) {
      filteredMembers = filteredMembers.filter(
        (m) => m.status === options.status
      );
    }

    if (options.hasPending === true) {
      filteredMembers = filteredMembers.filter((m) => m.pendingAmount > 0);
    }

    if (options.fullyPaid === true) {
      filteredMembers = filteredMembers.filter((m) => m.pendingAmount === 0);
    }

    const total = overallMembersWithStatus.length;
    const filteredTotal = filteredMembers.length;
    const skip = (page - 1) * limit;
    const paginatedMembers = filteredMembers.slice(skip, skip + limit);

    const summary = {
      total,
      active: overallMembersWithStatus.filter((member) => member.status === "active").length,
      expiring: overallMembersWithStatus.filter((member) => member.status === "expiring_soon").length,
      pending: overallMembersWithStatus.filter((member) => member.pendingAmount > 0).length,
    };

    return {
      members: paginatedMembers,
      summary,
      pagination: {
        page,
        limit,
        total: filteredTotal,
        totalPages: Math.ceil(filteredTotal / limit),
      },
    };
  },

  async getMemberById(memberId: string, businessId: string) {
    const member = await Member.findOne({
      _id: new mongoose.Types.ObjectId(memberId),
      businessId: new mongoose.Types.ObjectId(businessId),
      isDeleted: false,
    });

    if (!member) throw new AppError("Member not found", 404);

    const expiryAlertDays = await getExpiryAlertDays(businessId);
    return attachComputedFields(member, expiryAlertDays);
  },

  async updateMember(
    memberId: string,
    businessId: string,
    userId: string,
    input: UpdateMemberInput
  ) {
    const member = await Member.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(memberId),
        businessId: new mongoose.Types.ObjectId(businessId),
        isDeleted: false,
      },
      { $set: { ...input, updatedBy: new mongoose.Types.ObjectId(userId) } },
      { new: true }
    );

    if (!member) throw new AppError("Member not found", 404);

    const expiryAlertDays = await getExpiryAlertDays(businessId);
    return attachComputedFields(member, expiryAlertDays);
  },

  async deleteMember(memberId: string, businessId: string, userId: string) {
    const member = await Member.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(memberId),
        businessId: new mongoose.Types.ObjectId(businessId),
        isDeleted: false,
      },
      {
        $set: {
          isDeleted: true,
          updatedBy: new mongoose.Types.ObjectId(userId),
        },
      },
      { new: true }
    );

    if (!member) throw new AppError("Member not found", 404);
    return member;
  },

  async addPayment(
    memberId: string,
    businessId: string,
    userId: string,
    input: AddPaymentInput
  ) {
    const member = await Member.findOne({
      _id: new mongoose.Types.ObjectId(memberId),
      businessId: new mongoose.Types.ObjectId(businessId),
      isDeleted: false,
    });

    if (!member) throw new AppError("Member not found", 404);

    if (member.membershipClosure) {
      throw new AppError(
        "Payments cannot be recorded after the membership has ended. Reopen the membership to continue billing.",
        400
      );
    }

    const pendingAmount = calculatePendingAmount(member.finalPrice, member.payments);
    if (input.amount > pendingAmount) {
      throw new AppError(`Payment cannot exceed pending amount of ${pendingAmount}`, 400);
    }

    member.payments.push({
      amount: input.amount,
      paidOn: new Date(input.paidOn),
      paymentMethod: input.paymentMethod,
      note: input.note,
      recordedBy: new mongoose.Types.ObjectId(userId),
    });

    member.updatedBy = new mongoose.Types.ObjectId(userId);
    await member.save();

    const expiryAlertDays = await getExpiryAlertDays(businessId);
    return attachComputedFields(member, expiryAlertDays);
  },

  async renewMember(
    memberId: string,
    businessId: string,
    userId: string,
    input: RenewMemberInput
  ) {
    const member = await Member.findOne({
      _id: new mongoose.Types.ObjectId(memberId),
      businessId: new mongoose.Types.ObjectId(businessId),
      isDeleted: false,
    });

    if (!member) throw new AppError("Member not found", 404);

    const expiryAlertDays = await getExpiryAlertDays(businessId);
    const currentStatus = deriveMemberStatus(
      member.startDate,
      member.endDate,
      expiryAlertDays
    );
    const isPlanChange =
      !member.membershipClosure &&
      (currentStatus === "active" || currentStatus === "expiring_soon");

    const planId = input.planId || member.planSnapshot.planId.toString();
    const slotId = input.slotId || member.slotSnapshot.slotId.toString();

    const plan = await Plan.findOne({
      _id: new mongoose.Types.ObjectId(planId),
      businessId: new mongoose.Types.ObjectId(businessId),
      isActive: true,
      isDeleted: false,
    });

    if (!plan) throw new AppError("Plan not found or is not active", 404);

    const slot = await Slot.findOne({
      _id: new mongoose.Types.ObjectId(slotId),
      businessId: new mongoose.Types.ObjectId(businessId),
      isActive: true,
      isDeleted: false,
    });

    if (!slot) throw new AppError("Slot not found or is not active", 404);

    let finalPrice: number;
    if (input.finalPrice !== undefined) {
      finalPrice = input.finalPrice;
    } else {
      finalPrice = await pricingService.calculateFinalPrice(
        businessId, planId, slotId, plan.basePrice
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const effectiveStartDate = isPlanChange ? todayString : input.startDate;
    const newStartDate = new Date(effectiveStartDate);
    const newEndDate = calculateEndDate(effectiveStartDate, plan.durationDays);

    let availableCredit = member.creditBalance ?? 0;
    let currentPlanShortfall = 0;
    if (isPlanChange) {
      const currentStartDate = new Date(member.startDate);
      currentStartDate.setHours(0, 0, 0, 0);

      const dayMs = 1000 * 60 * 60 * 24;
      const usedDays = Math.min(
        member.planSnapshot.durationDays,
        Math.max(
          1,
          Math.floor((today.getTime() - currentStartDate.getTime()) / dayMs) + 1
        )
      );
      const usedValue = Math.round(
        (member.finalPrice / member.planSnapshot.durationDays) * usedDays
      );
      const totalFundedValue =
        calculatePaidAmount(member.payments) + (member.creditBalance ?? 0);

      availableCredit = Math.max(0, totalFundedValue - usedValue);
      currentPlanShortfall = Math.max(0, usedValue - totalFundedValue);
    }

    const appliedCredit = Math.min(availableCredit, finalPrice);
    const remainingCreditBalance = Math.max(0, availableCredit - appliedCredit);
    const payableAfterCredit = Math.max(
      0,
      finalPrice - appliedCredit + currentPlanShortfall
    );
    if (input.initialPayment !== undefined && input.initialPayment > payableAfterCredit) {
      throw new AppError(`Payment cannot exceed payable amount of ${payableAfterCredit}`, 400);
    }

    member.planSnapshot = {
      planId: plan._id as mongoose.Types.ObjectId,
      name: plan.name,
      durationDays: plan.durationDays,
      basePrice: plan.basePrice,
    };

    member.slotSnapshot = {
      slotId: slot._id as mongoose.Types.ObjectId,
      label: slot.label,
      startTime: slot.startTime,
      endTime: slot.endTime,
    };

    member.startDate = newStartDate;
    member.endDate = newEndDate;
    member.finalPrice = finalPrice;
    member.creditBalance = remainingCreditBalance;
    member.membershipClosure = undefined;
    member.updatedBy = new mongoose.Types.ObjectId(userId);
    member.payments = [];

    if (appliedCredit > 0) {
      member.payments.push({
        amount: appliedCredit,
        paidOn: newStartDate,
        note: "Credit applied",
        recordedBy: new mongoose.Types.ObjectId(userId),
      });
    }

    if (input.initialPayment && input.initialPayment > 0) {
      const paymentAppliedToNewPlan = Math.max(
        0,
        input.initialPayment - currentPlanShortfall
      );

      if (paymentAppliedToNewPlan > 0) {
      member.payments.push({
        amount: paymentAppliedToNewPlan,
        paidOn: new Date(),
        paymentMethod: input.initialPaymentMethod,
        note: "Renewal payment",
        recordedBy: new mongoose.Types.ObjectId(userId),
      });
      }
    }

    await member.save();
    return attachComputedFields(member, expiryAlertDays);
  },

  async endMembership(
    memberId: string,
    businessId: string,
    userId: string,
    input: EndMembershipInput
  ) {
    const member = await Member.findOne({
      _id: new mongoose.Types.ObjectId(memberId),
      businessId: new mongoose.Types.ObjectId(businessId),
      isDeleted: false,
    });

    if (!member) throw new AppError("Member not found", 404);

    const effectiveEndDate = new Date(input.effectiveEndDate);
    effectiveEndDate.setHours(0, 0, 0, 0);

    const currentStartDate = new Date(member.startDate);
    currentStartDate.setHours(0, 0, 0, 0);

    const currentEndDate = new Date(member.endDate);
    currentEndDate.setHours(0, 0, 0, 0);

    if (effectiveEndDate < currentStartDate) {
      throw new AppError("End date cannot be before the membership start date", 400);
    }

    if (effectiveEndDate > currentEndDate) {
      throw new AppError("End date cannot be after the current renewal date", 400);
    }

    const dayMs = 1000 * 60 * 60 * 24;
    const usedDays = Math.min(
      member.planSnapshot.durationDays,
      Math.max(
        1,
        Math.floor((effectiveEndDate.getTime() - currentStartDate.getTime()) / dayMs) + 1
      )
    );
    const usedValue = Math.round(
      (member.finalPrice / member.planSnapshot.durationDays) * usedDays
    );
    const paidAmount = calculatePaidAmount(member.payments);
    const existingCredit = member.creditBalance ?? 0;
    const settlementDeduction = input.settlementDeduction ?? 0;
    const totalAvailableValue = paidAmount + existingCredit;
    const refundableBalance = Math.max(
      0,
      totalAvailableValue - usedValue - settlementDeduction
    );
    const payableBalance = Math.max(
      0,
      usedValue + settlementDeduction - totalAvailableValue
    );

    member.endDate = effectiveEndDate;
    member.creditBalance = 0;
    member.membershipClosure = {
      endedOn: effectiveEndDate,
      originalEndDate: currentEndDate,
      originalCreditBalance: existingCredit,
      usedValue,
      settlementDeduction,
      refundableBalance,
      payableBalance,
      note: input.note,
      closedBy: new mongoose.Types.ObjectId(userId),
    };
    member.updatedBy = new mongoose.Types.ObjectId(userId);

    await member.save();

    const expiryAlertDays = await getExpiryAlertDays(businessId);
    return attachComputedFields(member, expiryAlertDays);
  },

  async revertEndMembership(
    memberId: string,
    businessId: string,
    userId: string,
    _input: RevertEndMembershipInput
  ) {
    const member = await Member.findOne({
      _id: new mongoose.Types.ObjectId(memberId),
      businessId: new mongoose.Types.ObjectId(businessId),
      isDeleted: false,
    });

    if (!member) throw new AppError("Member not found", 404);

    if (!member.membershipClosure) {
      throw new AppError("This membership is not currently ended", 400);
    }

    if (
      !member.membershipClosure.originalEndDate ||
      member.membershipClosure.originalCreditBalance === undefined
    ) {
      throw new AppError(
        "Revert is unavailable for this record because the previous membership state was not saved",
        400
      );
    }

    member.endDate = new Date(member.membershipClosure.originalEndDate);
    member.creditBalance = member.membershipClosure.originalCreditBalance;
    member.membershipClosure = undefined;
    member.updatedBy = new mongoose.Types.ObjectId(userId);

    await member.save();

    const expiryAlertDays = await getExpiryAlertDays(businessId);
    return attachComputedFields(member, expiryAlertDays);
  },
};
