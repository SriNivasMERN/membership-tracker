import mongoose from "mongoose";
import { Slot, ISlotDocument } from "./slot.model";
import { AppError } from "../../middleware/error.middleware";
import {
  CreateSlotInput,
  UpdateSlotInput,
  ToggleSlotInput,
} from "./slot.schema";

export const slotService = {

  async getAllSlots(businessId: string): Promise<ISlotDocument[]> {
    return Slot.find({
      businessId: new mongoose.Types.ObjectId(businessId),
      isDeleted: false,
    })
      .sort({ startTime: 1 })
      .lean() as unknown as ISlotDocument[];
  },

  async getActiveSlots(businessId: string): Promise<ISlotDocument[]> {
    return Slot.find({
      businessId: new mongoose.Types.ObjectId(businessId),
      isActive: true,
      isDeleted: false,
    })
      .sort({ startTime: 1 })
      .lean() as unknown as ISlotDocument[];
  },

  async getSlotById(
    slotId: string,
    businessId: string
  ): Promise<ISlotDocument> {
    const slot = await Slot.findOne({
      _id: new mongoose.Types.ObjectId(slotId),
      businessId: new mongoose.Types.ObjectId(businessId),
      isDeleted: false,
    }).lean();

    if (!slot) {
      throw new AppError("Slot not found", 404);
    }

    return slot as unknown as ISlotDocument;
  },

  async createSlot(
    businessId: string,
    input: CreateSlotInput
  ): Promise<ISlotDocument> {
    // Check duplicate label within this business
    const existing = await Slot.findOne({
      businessId: new mongoose.Types.ObjectId(businessId),
      label: { $regex: new RegExp(`^${input.label}$`, "i") },
      isDeleted: false,
    }).lean();

    if (existing) {
      throw new AppError("A slot with this label already exists", 409);
    }

    const slot = await Slot.create({
      businessId: new mongoose.Types.ObjectId(businessId),
      ...input,
    });

    return slot;
  },

  async updateSlot(
    slotId: string,
    businessId: string,
    input: UpdateSlotInput
  ): Promise<ISlotDocument> {
    if (input.label) {
      const existing = await Slot.findOne({
        businessId: new mongoose.Types.ObjectId(businessId),
        label: { $regex: new RegExp(`^${input.label}$`, "i") },
        isDeleted: false,
        _id: { $ne: new mongoose.Types.ObjectId(slotId) },
      }).lean();

      if (existing) {
        throw new AppError(
          "A slot with this label already exists",
          409
        );
      }
    }

    const slot = await Slot.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(slotId),
        businessId: new mongoose.Types.ObjectId(businessId),
        isDeleted: false,
      },
      { $set: input },
      { new: true, runValidators: true }
    );

    if (!slot) {
      throw new AppError("Slot not found", 404);
    }

    return slot;
  },

  async toggleSlotStatus(
    slotId: string,
    businessId: string,
    input: ToggleSlotInput
  ): Promise<ISlotDocument> {
    const slot = await Slot.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(slotId),
        businessId: new mongoose.Types.ObjectId(businessId),
        isDeleted: false,
      },
      { $set: { isActive: input.isActive } },
      { new: true }
    );

    if (!slot) {
      throw new AppError("Slot not found", 404);
    }

    return slot;
  },

  async deleteSlot(
    slotId: string,
    businessId: string
  ): Promise<void> {
    const slot = await Slot.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(slotId),
        businessId: new mongoose.Types.ObjectId(businessId),
        isDeleted: false,
      },
      { $set: { isDeleted: true, isActive: false } },
      { new: true }
    );

    if (!slot) {
      throw new AppError("Slot not found", 404);
    }
  },
};
