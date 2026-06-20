import mongoose, { Document, Schema } from "mongoose";

export interface IPlan {
  businessId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  durationDays: number;
  basePrice: number;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPlanDocument extends IPlan, Document {}

const planSchema = new Schema<IPlanDocument>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    name: {
      type: String,
      required: [true, "Plan name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    durationDays: {
      type: Number,
      required: [true, "Duration is required"],
      min: [1, "Duration must be at least 1 day"],
    },
    basePrice: {
      type: Number,
      required: [true, "Base price is required"],
      min: [0, "Price cannot be negative"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for fast queries per business
planSchema.index({ businessId: 1, isDeleted: 1 });
planSchema.index({ businessId: 1, isDeleted: 1, isActive: 1 });
planSchema.index({ businessId: 1, isDeleted: 1, createdAt: -1 });

export const Plan = mongoose.model<IPlanDocument>("Plan", planSchema);
