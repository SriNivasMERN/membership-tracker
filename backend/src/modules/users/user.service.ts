import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { User, IUserDocument } from "../auth/user.model";
import { AppError } from "../../middleware/error.middleware";
import {
  CreateUserInput,
  UpdateUserInput,
  ToggleUserInput,
  UpdateCredentialsInput,
} from "./user.schema";

export const userService = {

  async getAllUsers(businessId: string): Promise<IUserDocument[]> {
    return User.find({
      businessId: new mongoose.Types.ObjectId(businessId),
    })
      .sort({ createdAt: -1 })
      .lean() as unknown as IUserDocument[];
  },

  async getUserById(
    userId: string,
    businessId: string
  ): Promise<IUserDocument> {
    const user = await User.findOne({
      _id: new mongoose.Types.ObjectId(userId),
      businessId: new mongoose.Types.ObjectId(businessId),
    }).lean();

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user as unknown as IUserDocument;
  },

  async getCurrentUser(userId: string): Promise<IUserDocument> {
    const user = await User.findById(userId).lean();

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user as unknown as IUserDocument;
  },

  async createUser(
    businessId: string,
    input: CreateUserInput
  ): Promise<IUserDocument> {
    const existing = await User.findOne({ email: input.email });

    if (existing) {
      throw new AppError("Email is already registered", 409);
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);

    const user = await User.create({
      businessId: new mongoose.Types.ObjectId(businessId),
      name: input.name,
      email: input.email,
      password: hashedPassword,
      role: input.role,
      isActive: true,
    });

    return user;
  },

  async updateUser(
    userId: string,
    businessId: string,
    input: UpdateUserInput
  ): Promise<IUserDocument> {
    const user = await User.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(userId),
        businessId: new mongoose.Types.ObjectId(businessId),
      },
      { $set: input },
      { new: true }
    );

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  },

  async toggleUserStatus(
    userId: string,
    businessId: string,
    input: ToggleUserInput,
    requestingUserId: string
  ): Promise<IUserDocument> {
    if (userId === requestingUserId) {
      throw new AppError("You cannot deactivate your own account", 400);
    }

    const targetUser = await User.findOne({
      _id: new mongoose.Types.ObjectId(userId),
      businessId: new mongoose.Types.ObjectId(businessId),
    });

    if (!targetUser) {
      throw new AppError("User not found", 404);
    }

    if (targetUser.role === "owner") {
      throw new AppError("Owner account cannot be deactivated", 400);
    }

    const user = await User.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(userId),
        businessId: new mongoose.Types.ObjectId(businessId),
      },
      { $set: { isActive: input.isActive } },
      { new: true }
    );

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  },

  // NEW - update email and/or password for a staff user
  async updateCredentials(
    userId: string,
    businessId: string,
    input: UpdateCredentialsInput
  ): Promise<IUserDocument> {
    const targetUser = await User.findOne({
      _id: new mongoose.Types.ObjectId(userId),
      businessId: new mongoose.Types.ObjectId(businessId),
    });

    if (!targetUser) {
      throw new AppError("User not found", 404);
    }

    // Owner credentials cannot be changed by this endpoint
    if (targetUser.role === "owner") {
      throw new AppError("Owner credentials cannot be changed here", 400);
    }

    // If email is changing, check it is not already taken
    if (input.email && input.email !== targetUser.email) {
      const existing = await User.findOne({ email: input.email });
      if (existing) {
        throw new AppError("Email is already registered", 409);
      }
    }

    const updates: Record<string, string> = {};

    if (input.email) {
      updates.email = input.email;
    }

    if (input.newPassword) {
      updates.password = await bcrypt.hash(input.newPassword, 10);
    }

    const user = await User.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(userId),
        businessId: new mongoose.Types.ObjectId(businessId),
      },
      { $set: updates },
      { new: true }
    );

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  },
};
