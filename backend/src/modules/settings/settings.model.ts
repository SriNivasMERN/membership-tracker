import mongoose, { Document, Schema } from "mongoose";

export interface ITerminology {
  planLabel: string;
  slotLabel: string;
  memberLabel: string;
}

export interface IBusinessSettings {
  businessId: mongoose.Types.ObjectId;
  businessName: string;
  businessType: string;
  email?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  terminology: ITerminology;
  expiryAlertDays: number;
  isConfigured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBusinessSettingsDocument
  extends IBusinessSettings,
    Document {}

const terminologySchema = new Schema<ITerminology>(
  {
    planLabel: { type: String, default: "Plan" },
    slotLabel: { type: String, default: "Slot" },
    memberLabel: { type: String, default: "Member" },
  },
  { _id: false }
);

const businessSettingsSchema = new Schema<IBusinessSettingsDocument>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      required: true,
      unique: true,
    },
    businessName: {
      type: String,
      required: [true, "Business name is required"],
      trim: true,
    },
    businessType: {
      type: String,
      required: [true, "Business type is required"],
      enum: [
        "gym",
        "yoga_studio",
        "coaching_center",
        "library",
        "sports_facility",
        "clinic",
        "other",
      ],
    },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    logoUrl: { type: String },
    terminology: {
      type: terminologySchema,
      default: () => ({
        planLabel: "Plan",
        slotLabel: "Slot",
        memberLabel: "Member",
      }),
    },
    expiryAlertDays: {
      type: Number,
      default: 7,
      min: [1, "Alert days must be at least 1"],
      max: [90, "Alert days cannot exceed 90"],
    },
    isConfigured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const BusinessSettings =
  mongoose.model<IBusinessSettingsDocument>(
    "BusinessSettings",
    businessSettingsSchema
  );