import mongoose, { Document, Schema } from "mongoose";
import { UserRole } from "../../types/shared.types";

export type AuditModule =
  | "members"
  | "plans"
  | "slots"
  | "pricing"
  | "users"
  | "settings";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "activate"
  | "deactivate"
  | "payment"
  | "renew"
  | "end"
  | "revert"
  | "credentials"
  | "save";

export interface IAuditActor {
  userId: mongoose.Types.ObjectId;
  name: string;
  role: UserRole;
}

export interface IAuditTrail {
  businessId: mongoose.Types.ObjectId;
  module: AuditModule;
  action: AuditAction;
  entityId?: string;
  entityLabel?: string;
  description?: string;
  performedBy: IAuditActor;
  createdAt: Date;
}

export interface IAuditTrailDocument extends IAuditTrail, Document {}

const auditActorSchema = new Schema<IAuditActor>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["owner", "staff"],
      required: true,
    },
  },
  { _id: false }
);

const auditTrailSchema = new Schema<IAuditTrailDocument>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    module: {
      type: String,
      enum: ["members", "plans", "slots", "pricing", "users", "settings"],
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: [
        "create",
        "update",
        "delete",
        "activate",
        "deactivate",
        "payment",
        "renew",
        "end",
        "revert",
        "credentials",
        "save",
      ],
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      trim: true,
    },
    entityLabel: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    performedBy: {
      type: auditActorSchema,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

auditTrailSchema.index({ businessId: 1, createdAt: -1 });
auditTrailSchema.index({ businessId: 1, module: 1, createdAt: -1 });

export const AuditTrail = mongoose.model<IAuditTrailDocument>(
  "AuditTrail",
  auditTrailSchema
);
