import mongoose, { Document, Schema } from "mongoose";

// Payment entry shape
export interface IPaymentEntry {
  amount: number;
  paidOn: Date;
  note?: string;
  recordedBy: mongoose.Types.ObjectId;
}

// Plan snapshot - copied at member creation time
export interface IPlanSnapshot {
  planId: mongoose.Types.ObjectId;
  name: string;
  durationDays: number;
  basePrice: number;
}

// Slot snapshot - copied at member creation time
export interface ISlotSnapshot {
  slotId: mongoose.Types.ObjectId;
  label: string;
  startTime: string;
  endTime: string;
}

// Full member interface
export interface IMember {
  businessId: mongoose.Types.ObjectId;
  name: string;
  mobile: string;
  email?: string;
  photo?: string;
  planSnapshot: IPlanSnapshot;
  slotSnapshot: ISlotSnapshot;
  startDate: Date;
  endDate: Date;
  finalPrice: number;
  payments: IPaymentEntry[];
  notes?: string;
  isDeleted: boolean;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMemberDocument extends IMember, Document {}

// Payment entry sub-schema
const paymentEntrySchema = new Schema<IPaymentEntry>(
  {
    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: [0, "Payment amount cannot be negative"],
    },
    paidOn: {
      type: Date,
      required: [true, "Payment date is required"],
    },
    note: {
      type: String,
      trim: true,
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      required: true,
    },
  },
  { _id: true }
);

// Plan snapshot sub-schema
const planSnapshotSchema = new Schema<IPlanSnapshot>(
  {
    planId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    durationDays: { type: Number, required: true },
    basePrice: { type: Number, required: true },
  },
  { _id: false }
);

// Slot snapshot sub-schema
const slotSnapshotSchema = new Schema<ISlotSnapshot>(
  {
    slotId: { type: Schema.Types.ObjectId, required: true },
    label: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  { _id: false }
);

// Main member schema
const memberSchema = new Schema<IMemberDocument>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    name: {
      type: String,
      required: [true, "Member name is required"],
      trim: true,
    },
    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    photo: {
      type: String,
    },
    planSnapshot: {
      type: planSnapshotSchema,
      required: true,
    },
    slotSnapshot: {
      type: slotSnapshotSchema,
      required: true,
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    finalPrice: {
      type: Number,
      required: [true, "Final price is required"],
      min: [0, "Final price cannot be negative"],
    },
    payments: {
      type: [paymentEntrySchema],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      required: true,
    },
  },
  { timestamps: true }
);

// Unique mobile per business - one member per mobile number
memberSchema.index(
  { businessId: 1, mobile: 1 },
  { unique: true }
);

// Index for fast queries
memberSchema.index({ businessId: 1, isDeleted: 1 });
memberSchema.index({ businessId: 1, endDate: 1 });

export const Member = mongoose.model<IMemberDocument>(
  "Member",
  memberSchema
);