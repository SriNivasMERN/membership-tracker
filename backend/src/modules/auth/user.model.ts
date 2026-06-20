import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import { UserRole } from "../../types/shared.types";

export interface IUser {
  businessId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  refreshTokenHash?: string;
  lastLoginAt?: Date | null;
  previousLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

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
    lastLoginAt: {
      type: Date,
      default: null,
    },
    previousLoginAt: {
      type: Date,
      default: null,
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

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.index({ businessId: 1, isActive: 1, createdAt: -1 });
userSchema.index({ businessId: 1, role: 1 });

export const User = mongoose.model<IUserDocument>("User", userSchema);
