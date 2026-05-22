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
} from "./member.schema";

// Helper - get expiryAlertDays from business settings
// Defaults to 7 if settings not configured
const getExpiryAlertDays = async (
  businessId: string
): Promise<number> => {
  const settings = await BusinessSettings.findOne({
    businessId: new mongoose.Types.ObjectId(businessId),
  });
  return settings?.expiryAlertDays ?? 7;
};

// Helper - attach computed fields to member document
// Status, paidAmount, pendingAmount are not stored - calculated here
export const attachComputedFields = (
  member: IMemberDocument,
  expiryAlertDays: number
) => {
  const paidAmount = calculatePaidAmount(member.payments);
  const pendingAmount = calculatePendingAmount(
    member.finalPrice,
    member.payments
  );
  const status = deriveMemberStatus(
    member.startDate,
    member.endDate,
    expiryAlertDays
  );

  return {
    ...member.toObject(),
    paidAmount,
    pendingAmount,
    status,
  };
};

export const memberService = {

  // Create a new member
  async createMember(
    businessId: string,
    userId: string,
    input: CreateMemberInput
  ): Promise<IMemberDocument> {

    // Check mobile not already registered for this business
    const existingMobile = await Member.findOne({
      businessId: new mongoose.Types.ObjectId(businessId),
      mobile: input.mobile,
      isDeleted: false,
    });

    if (existingMobile) {
      throw new AppError(
        "A member with this mobile number already exists",
        409
      );
    }

    // Fetch plan - must exist and be active
    const plan = await Plan.findOne({
      _id: new mongoose.Types.ObjectId(input.planId),
      businessId: new mongoose.Types.ObjectId(businessId),
      isActive: true,
      isDeleted: false,
    });

    if (!plan) {
      throw new AppError(
        "Plan not found or is not active",
        404
      );
    }

    // Fetch slot - must exist and be active
    const slot = await Slot.findOne({
      _id: new mongoose.Types.ObjectId(input.slotId),
      businessId: new mongoose.Types.ObjectId(businessId),
      isActive: true,
      isDeleted: false,
    });

    if (!slot) {
      throw new AppError(
        "Slot not found or is not active",
        404
      );
    }

    // Calculate final price
    // Staff override takes priority if provided
    let finalPrice: number;
    if (input.finalPrice !== undefined) {
      finalPrice = input.finalPrice;
    } else {
      finalPrice = await pricingService.calculateFinalPrice(
        businessId,
        input.planId,
        input.slotId,
        plan.basePrice
      );
    }

    // Calculate end date from start date and plan duration
    const endDate = calculateEndDate(input.startDate, plan.durationDays);

    // Build payments array from initial payment
    const payments = [];
    if (input.initialPayment && input.initialPayment > 0) {
      payments.push({
        amount: input.initialPayment,
        paidOn: new Date(),
        note: "Initial payment",
        recordedBy: new mongoose.Types.ObjectId(userId),
      });
    }

    // Create member with full snapshots
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
      payments,
      notes: input.notes,
      createdBy: new mongoose.Types.ObjectId(userId),
      updatedBy: new mongoose.Types.ObjectId(userId),
    });

    return member;
  },

  // List members with pagination and search
  async listMembers(
    businessId: string,
    options: {
      page: number;
      limit: number;
      search?: string;
    }
  ) {
    const { page, limit, search } = options;
    const skip = (page - 1) * limit;

    // Build query
    const query: Record<string, unknown> = {
      businessId: new mongoose.Types.ObjectId(businessId),
      isDeleted: false,
    };

    // Search by name or mobile
    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { mobile: { $regex: search.trim(), $options: "i" } },
      ];
    }

    // Run query and count in parallel for performance
    const [members, total] = await Promise.all([
      Member.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Member.countDocuments(query),
    ]);

    // Get expiry alert days for status calculation
    const expiryAlertDays = await getExpiryAlertDays(businessId);

    // Attach computed fields to each member
    const membersWithStatus = members.map((member) =>
      attachComputedFields(member, expiryAlertDays)
    );

    return {
      members: membersWithStatus,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  // Get single member by ID
  async getMemberById(
    memberId: string,
    businessId: string
  ) {
    const member = await Member.findOne({
      _id: new mongoose.Types.ObjectId(memberId),
      businessId: new mongoose.Types.ObjectId(businessId),
      isDeleted: false,
    });

    if (!member) {
      throw new AppError("Member not found", 404);
    }

    const expiryAlertDays = await getExpiryAlertDays(businessId);
    return attachComputedFields(member, expiryAlertDays);
  },

  // Update member personal details
  // Plan and slot changes not allowed via update - use renew instead
  async updateMember(
    memberId: string,
    businessId: string,
    userId: string,
    input: UpdateMemberInput
  ) {
    // If mobile is being changed, check for duplicates
    if (input.mobile) {
      const existing = await Member.findOne({
        businessId: new mongoose.Types.ObjectId(businessId),
        mobile: input.mobile,
        isDeleted: false,
        _id: { $ne: new mongoose.Types.ObjectId(memberId) },
      });

      if (existing) {
        throw new AppError(
          "A member with this mobile number already exists",
          409
        );
      }
    }

    const member = await Member.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(memberId),
        businessId: new mongoose.Types.ObjectId(businessId),
        isDeleted: false,
      },
      {
        $set: {
          ...input,
          updatedBy: new mongoose.Types.ObjectId(userId),
        },
      },
      { new: true, runValidators: true }
    );

    if (!member) {
      throw new AppError("Member not found", 404);
    }

    const expiryAlertDays = await getExpiryAlertDays(businessId);
    return attachComputedFields(member, expiryAlertDays);
  },

  // Soft delete member
  async deleteMember(
    memberId: string,
    businessId: string,
    userId: string
  ): Promise<void> {
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
      }
    );

    if (!member) {
      throw new AppError("Member not found", 404);
    }
  },

  // Add a payment entry to existing member
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

    if (!member) {
      throw new AppError("Member not found", 404);
    }

    // Add payment entry to array
    member.payments.push({
      amount: input.amount,
      paidOn: new Date(input.paidOn),
      note: input.note,
      recordedBy: new mongoose.Types.ObjectId(userId),
    });

    member.updatedBy = new mongoose.Types.ObjectId(userId);
    await member.save();

    const expiryAlertDays = await getExpiryAlertDays(businessId);
    return attachComputedFields(member, expiryAlertDays);
  },

  // Renew membership - extends end date, optionally changes plan/slot
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

    if (!member) {
      throw new AppError("Member not found", 404);
    }

    // Use new plan if provided, otherwise keep existing
    const planId = input.planId || member.planSnapshot.planId.toString();
    const slotId = input.slotId || member.slotSnapshot.slotId.toString();

    // Fetch plan
    const plan = await Plan.findOne({
      _id: new mongoose.Types.ObjectId(planId),
      businessId: new mongoose.Types.ObjectId(businessId),
      isActive: true,
      isDeleted: false,
    });

    if (!plan) {
      throw new AppError("Plan not found or is not active", 404);
    }

    // Fetch slot
    const slot = await Slot.findOne({
      _id: new mongoose.Types.ObjectId(slotId),
      businessId: new mongoose.Types.ObjectId(businessId),
      isActive: true,
      isDeleted: false,
    });

    if (!slot) {
      throw new AppError("Slot not found or is not active", 404);
    }

    // Calculate new final price
    let finalPrice: number;
    if (input.finalPrice !== undefined) {
      finalPrice = input.finalPrice;
    } else {
      finalPrice = await pricingService.calculateFinalPrice(
        businessId,
        planId,
        slotId,
        plan.basePrice
      );
    }

    // New start date and end date
    const newStartDate = new Date(input.startDate);
    const newEndDate = calculateEndDate(input.startDate, plan.durationDays);

    // Update snapshots and dates
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
    member.updatedBy = new mongoose.Types.ObjectId(userId);

    // Add renewal payment if provided
    if (input.initialPayment && input.initialPayment > 0) {
      member.payments.push({
        amount: input.initialPayment,
        paidOn: new Date(),
        note: "Renewal payment",
        recordedBy: new mongoose.Types.ObjectId(userId),
      });
    }

    await member.save();

    const expiryAlertDays = await getExpiryAlertDays(businessId);
    return attachComputedFields(member, expiryAlertDays);
  }
};