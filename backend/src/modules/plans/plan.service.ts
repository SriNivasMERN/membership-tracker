import mongoose from "mongoose";
import { Plan, IPlanDocument } from "./plan.model";
import { AppError } from "../../middleware/error.middleware";
import {
  CreatePlanInput,
  UpdatePlanInput,
  TogglePlanInput,
} from "./plan.schema";

export const planService = {

  // Get all non-deleted plans for a business
  async getAllPlans(businessId: string): Promise<IPlanDocument[]> {
    return Plan.find({
      businessId: new mongoose.Types.ObjectId(businessId),
      isDeleted: false,
    }).sort({ createdAt: -1 });
  },

  // Get only active plans - used during member creation
  async getActivePlans(businessId: string): Promise<IPlanDocument[]> {
    return Plan.find({
      businessId: new mongoose.Types.ObjectId(businessId),
      isActive: true,
      isDeleted: false,
    }).sort({ name: 1 });
  },

  // Get single plan by ID
  async getPlanById(
    planId: string,
    businessId: string
  ): Promise<IPlanDocument> {
    const plan = await Plan.findOne({
      _id: new mongoose.Types.ObjectId(planId),
      businessId: new mongoose.Types.ObjectId(businessId),
      isDeleted: false,
    });

    if (!plan) {
      throw new AppError("Plan not found", 404);
    }

    return plan;
  },

  // Create a new plan
  async createPlan(
    businessId: string,
    input: CreatePlanInput
  ): Promise<IPlanDocument> {
    // Check for duplicate plan name within this business
    const existing = await Plan.findOne({
      businessId: new mongoose.Types.ObjectId(businessId),
      name: { $regex: new RegExp(`^${input.name}$`, "i") },
      isDeleted: false,
    });

    if (existing) {
      throw new AppError(
        "A plan with this name already exists",
        409
      );
    }

    const plan = await Plan.create({
      businessId: new mongoose.Types.ObjectId(businessId),
      ...input,
    });

    return plan;
  },

  // Update plan details
  async updatePlan(
    planId: string,
    businessId: string,
    input: UpdatePlanInput
  ): Promise<IPlanDocument> {
    // If name is being changed, check for duplicates
    if (input.name) {
      const existing = await Plan.findOne({
        businessId: new mongoose.Types.ObjectId(businessId),
        name: { $regex: new RegExp(`^${input.name}$`, "i") },
        isDeleted: false,
        _id: { $ne: new mongoose.Types.ObjectId(planId) },
      });

      if (existing) {
        throw new AppError(
          "A plan with this name already exists",
          409
        );
      }
    }

    const plan = await Plan.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(planId),
        businessId: new mongoose.Types.ObjectId(businessId),
        isDeleted: false,
      },
      { $set: input },
      { new: true, runValidators: true }
    );

    if (!plan) {
      throw new AppError("Plan not found", 404);
    }

    return plan;
  },

  // Toggle active/inactive status
  async togglePlanStatus(
    planId: string,
    businessId: string,
    input: TogglePlanInput
  ): Promise<IPlanDocument> {
    const plan = await Plan.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(planId),
        businessId: new mongoose.Types.ObjectId(businessId),
        isDeleted: false,
      },
      { $set: { isActive: input.isActive } },
      { new: true }
    );

    if (!plan) {
      throw new AppError("Plan not found", 404);
    }

    return plan;
  },

  // Soft delete a plan
  async deletePlan(
    planId: string,
    businessId: string
  ): Promise<void> {
    const plan = await Plan.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(planId),
        businessId: new mongoose.Types.ObjectId(businessId),
        isDeleted: false,
      },
      { $set: { isDeleted: true, isActive: false } },
      { new: true }
    );

    if (!plan) {
      throw new AppError("Plan not found", 404);
    }
  },
};