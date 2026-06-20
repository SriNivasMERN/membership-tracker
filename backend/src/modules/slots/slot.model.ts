import mongoose, { Document, Schema } from "mongoose";

export interface ISlot {
  businessId: mongoose.Types.ObjectId;
  label: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISlotDocument extends ISlot, Document {}

const slotSchema = new Schema<ISlotDocument>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    label: {
      type: String,
      required: [true, "Slot label is required"],
      trim: true,
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
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

slotSchema.index({ businessId: 1, isDeleted: 1 });
slotSchema.index({ businessId: 1, isDeleted: 1, isActive: 1 });
slotSchema.index({ businessId: 1, isDeleted: 1, startTime: 1 });

export const Slot = mongoose.model<ISlotDocument>("Slot", slotSchema);
