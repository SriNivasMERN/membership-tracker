import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { User, IUserDocument } from "../auth/user.model";
import { AppError } from "../../middleware/error.middleware";
import {
  CreateUserInput,
  UpdateUserInput,
  ToggleUserInput,
} from "./user.schema";

export const userService = {

  // Get all users for this business
  async getAllUsers(businessId: string): Promise<IUserDocument[]> {
    return User.find({
      businessId: new mongoose.Types.ObjectId(businessId),
    }).sort({ createdAt: -1 });
  },

  // Get single user by ID
  async getUserById(
    userId: string,
    businessId: string
  ): Promise<IUserDocument> {
    const user = await User.findOne({
      _id: new mongoose.Types.ObjectId(userId),
      businessId: new mongoose.Types.ObjectId(businessId),
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  },

  // Get currently logged in user profile
  async getCurrentUser(userId: string): Promise<IUserDocument> {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  },

  // Create a new staff account
  async createUser(
    businessId: string,
    input: CreateUserInput
  ): Promise<IUserDocument> {
    // Check email is not already taken
    const existing = await User.findOne({
      email: input.email,
    });

    if (existing) {
      throw new AppError("Email is already registered", 409);
    }

    // Hash password before storing
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

  // Update user name
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

  // Activate or deactivate a user account
  async toggleUserStatus(
    userId: string,
    businessId: string,
    input: ToggleUserInput,
    requestingUserId: string
  ): Promise<IUserDocument> {
    // Prevent owner from deactivating their own account
    if (userId === requestingUserId) {
      throw new AppError(
        "You cannot deactivate your own account",
        400
      );
    }

    // Prevent deactivating another owner account
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
};