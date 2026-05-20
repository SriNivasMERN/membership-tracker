import mongoose from "mongoose";
import { PricingRule, IPricingRuleDocument } from "./pricing.model";
import { Plan } from "../plans/plan.model";
import { Slot } from "../slots/slot.model";
import { AppError } from "../../middleware/error.middleware";
import {
  CreatePricingRuleInput,
  UpdatePricingRuleInput,
} from "./pricing.schema";

export const pricingService = {

  // Get all pricing rules for a business with plan and slot details
  async getAllRules(businessId: string): Promise<IPricingRuleDocument[]> {
    return PricingRule.find({
      businessId: new mongoose.Types.ObjectId(businessId),
    })
      .populate("planId", "name basePrice isActive")
      .populate("slotId", "label startTime endTime isActive")
      .sort({ createdAt: -1 });
  },

  // Get single rule by ID
  async getRuleById(
    ruleId: string,
    businessId: string
  ): Promise<IPricingRuleDocument> {
    const rule = await PricingRule.findOne({
      _id: new mongoose.Types.ObjectId(ruleId),
      businessId: new mongoose.Types.ObjectId(businessId),
    })
      .populate("planId", "name basePrice")
      .populate("slotId", "label startTime endTime");

    if (!rule) {
      throw new AppError("Pricing rule not found", 404);
    }

    return rule;
  },

  // Find rule for a specific plan/slot combination
  // Used during member creation to calculate final price
  async getRuleForPlanSlot(
    businessId: string,
    planId: string,
    slotId: string
  ): Promise<IPricingRuleDocument | null> {
    return PricingRule.findOne({
      businessId: new mongoose.Types.ObjectId(businessId),
      planId: new mongoose.Types.ObjectId(planId),
      slotId: new mongoose.Types.ObjectId(slotId),
      isActive: true,
    });
  },

  // Create a new pricing rule
  async createRule(
    businessId: string,
    input: CreatePricingRuleInput
  ): Promise<IPricingRuleDocument> {
    // Verify plan exists and belongs to this business
    const plan = await Plan.findOne({
      _id: new mongoose.Types.ObjectId(input.planId),
      businessId: new mongoose.Types.ObjectId(businessId),
      isDeleted: false,
    });
    if (!plan) {
      throw new AppError("Plan not found", 404);
    }

    // Verify slot exists and belongs to this business
    const slot = await Slot.findOne({
      _id: new mongoose.Types.ObjectId(input.slotId),
      businessId: new mongoose.Types.ObjectId(businessId),
      isDeleted: false,
    });
    if (!slot) {
      throw new AppError("Slot not found", 404);
    }

    // Check for duplicate rule
    const existing = await PricingRule.findOne({
      businessId: new mongoose.Types.ObjectId(businessId),
      planId: new mongoose.Types.ObjectId(input.planId),
      slotId: new mongoose.Types.ObjectId(input.slotId),
    });
    if (existing) {
      throw new AppError(
        "A pricing rule already exists for this plan and slot combination",
        409
      );
    }

    const rule = await PricingRule.create({
      businessId: new mongoose.Types.ObjectId(businessId),
      planId: new mongoose.Types.ObjectId(input.planId),
      slotId: new mongoose.Types.ObjectId(input.slotId),
      multiplier: input.multiplier,
      isActive: input.isActive ?? true,
    });

    return rule;
  },

  // Update multiplier or active status
  async updateRule(
    ruleId: string,
    businessId: string,
    input: UpdatePricingRuleInput
  ): Promise<IPricingRuleDocument> {
    const rule = await PricingRule.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(ruleId),
        businessId: new mongoose.Types.ObjectId(businessId),
      },
      { $set: input },
      { new: true, runValidators: true }
    )
      .populate("planId", "name basePrice")
      .populate("slotId", "label startTime endTime");

    if (!rule) {
      throw new AppError("Pricing rule not found", 404);
    }

    return rule;
  },

  // Delete a pricing rule - hard delete is fine here
  // No member records reference pricing rules directly
  // Members store the final calculated price as a snapshot
  async deleteRule(
    ruleId: string,
    businessId: string
  ): Promise<void> {
    const rule = await PricingRule.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(ruleId),
      businessId: new mongoose.Types.ObjectId(businessId),
    });

    if (!rule) {
      throw new AppError("Pricing rule not found", 404);
    }
  },

  // Calculate final price for a plan/slot combination
  // Used during member creation
  async calculateFinalPrice(
    businessId: string,
    planId: string,
    slotId: string,
    basePrice: number
  ): Promise<number> {
    const rule = await this.getRuleForPlanSlot(
      businessId,
      planId,
      slotId
    );

    if (!rule) {
      return basePrice;
    }

    return Math.round(basePrice * rule.multiplier);
  },
};