import mongoose from "mongoose";
import { User } from "../auth/user.model";
import {
  AuditAction,
  AuditModule,
  AuditTrail,
  IAuditTrailDocument,
} from "./auditTrail.model";
import { UserRole } from "../../types/shared.types";

interface RecordAuditActionInput {
  businessId: string;
  module: AuditModule;
  action: AuditAction;
  performedByUserId: string;
  entityId?: string;
  entityLabel?: string;
  description?: string;
}

interface ListAuditTrailOptions {
  page: number;
  limit: number;
  module?: string;
  action?: string;
  actorRole?: string;
  search?: string;
}

export const auditTrailService = {
  async recordAction(
    input: RecordAuditActionInput
  ): Promise<IAuditTrailDocument> {
    const actor = await User.findById(input.performedByUserId)
      .select("name role")
      .lean();

    const actorName = actor?.name?.trim() || "Unknown User";
    const actorRole = (actor?.role || "staff") as UserRole;

    return AuditTrail.create({
      businessId: new mongoose.Types.ObjectId(input.businessId),
      module: input.module,
      action: input.action,
      entityId: input.entityId,
      entityLabel: input.entityLabel,
      description: input.description,
      performedBy: {
        userId: new mongoose.Types.ObjectId(input.performedByUserId),
        name: actorName,
        role: actorRole,
      },
    });
  },

  async listActions(
    businessId: string,
    options: ListAuditTrailOptions
  ) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {
      businessId: new mongoose.Types.ObjectId(businessId),
    };

    if (options.module) {
      filter.module = options.module;
    }

    if (options.action) {
      filter.action = options.action;
    }

    if (options.actorRole) {
      filter["performedBy.role"] = options.actorRole;
    }

    const search = options.search?.trim();
    if (search) {
      const pattern = new RegExp(search, "i");
      filter.$or = [
        { entityLabel: pattern },
        { description: pattern },
        { "performedBy.name": pattern },
        { module: pattern },
        { action: pattern },
      ];
    }

    const [entries, filteredCount, totalCount, ownerCount, staffCount] =
      await Promise.all([
        AuditTrail.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        AuditTrail.countDocuments(filter),
        AuditTrail.countDocuments({
          businessId: new mongoose.Types.ObjectId(businessId),
        }),
        AuditTrail.countDocuments({
          businessId: new mongoose.Types.ObjectId(businessId),
          "performedBy.role": "owner",
        }),
        AuditTrail.countDocuments({
          businessId: new mongoose.Types.ObjectId(businessId),
          "performedBy.role": "staff",
        }),
      ]);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayCount = await AuditTrail.countDocuments({
      businessId: new mongoose.Types.ObjectId(businessId),
      createdAt: { $gte: startOfToday },
    });

    return {
      entries,
      filteredCount,
      summary: {
        total: totalCount,
        today: todayCount,
        ownerActions: ownerCount,
        staffActions: staffCount,
      },
      pagination: {
        page,
        limit,
        total: filteredCount,
        totalPages: Math.max(1, Math.ceil(filteredCount / limit)),
      },
    };
  },
};
