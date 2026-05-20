import mongoose, { Document, Schema } from "mongoose";

export interface IPricingRule {
  businessId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  slotId: mongoose.Types.ObjectId;
  multiplier: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPricingRuleDocument extends IPricingRule, Document {}

const pricingRuleSchema = new Schema<IPricingRuleDocument>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },
    slotId: {
      type: Schema.Types.ObjectId,
      ref: "Slot",
      required: true,
    },
    multiplier: {
      type: Number,
      required: [true, "Multiplier is required"],
      min: [0.1, "Multiplier must be at least 0.1"],
      max: [10, "Multiplier cannot exceed 10"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// One rule per plan/slot combination per business
pricingRuleSchema.index(
  { businessId: 1, planId: 1, slotId: 1 },
  { unique: true }
);

export const PricingRule = mongoose.model<IPricingRuleDocument>(
  "PricingRule",
  pricingRuleSchema
);