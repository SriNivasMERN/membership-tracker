import mongoose, { Document, Schema } from "mongoose";
import { UserRole } from "../../types/shared.types";

export interface IUser {
  businessId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  refreshTokenHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, Document {}

const userSchema = new Schema<IUserDocument>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
    },
    role: {
      type: String,
      enum: ["owner", "staff"],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    refreshTokenHash: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.set("toJSON", {
  transform: function (_doc, ret) {
    const obj = ret as any;
    delete obj.password;
    delete obj.refreshTokenHash;
    return obj;
  },
});

export const User = mongoose.model<IUserDocument>("User", userSchema);