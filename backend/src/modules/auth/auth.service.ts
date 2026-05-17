import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { Response } from "express";
import { User, IUserDocument } from "./user.model";
import { AppError } from "../../middleware/error.middleware";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  TokenPayload,
} from "../../utils/token.utils";

interface RegisterOwnerInput {
  name: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface LoginResult {
  accessToken: string;
  user: IUserDocument;
}

export const authService = {
  async isOwnerRegistered(): Promise<boolean> {
    const owner = await User.findOne({ role: "owner" });
    return owner !== null;
  },

  async registerOwner(input: RegisterOwnerInput): Promise<IUserDocument> {
    const ownerExists = await this.isOwnerRegistered();
    if (ownerExists) {
      throw new AppError("Owner account already exists", 409);
    }

    const emailTaken = await User.findOne({
      email: input.email.toLowerCase(),
    });
    if (emailTaken) {
      throw new AppError("Email is already registered", 409);
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);
    const placeholderBusinessId = new mongoose.Types.ObjectId();

    const owner = await User.create({
      businessId: placeholderBusinessId,
      name: input.name,
      email: input.email.toLowerCase(),
      password: hashedPassword,
      role: "owner",
      isActive: true,
    });

    return owner;
  },

  async login(input: LoginInput, res: Response): Promise<LoginResult> {
    // Find user by email - include password field explicitly
    // password is excluded by default via toJSON but we need it here
    const user = await User.findOne({
      email: input.email.toLowerCase(),
    }).select("+password");

    // User not found - use generic message, never reveal which field is wrong
    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    // Account deactivated
    if (!user.isActive) {
      throw new AppError("Your account has been deactivated", 403);
    }

    // Compare password with stored hash
    const isPasswordValid = await user.comparePassword(input.password);
    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", 401);
    }

    // Build token payload
    const tokenPayload: TokenPayload = {
      userId: user._id.toString(),
      role: user.role,
      businessId: user.businessId.toString(),
    };

    // Generate both tokens
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Hash refresh token before storing - never store plain token
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await User.findByIdAndUpdate(user._id, { refreshTokenHash });

    // Set refresh token as httpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false, // set to true in production (HTTPS only)
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });

    return { accessToken, user };
  },

  async logout(res: Response): Promise<void> {
    // Clear the cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });
  },

  async refreshAccessToken(
  refreshTokenFromCookie: string | undefined,
  res: Response
): Promise<string> {
  if (!refreshTokenFromCookie) {
    throw new AppError("Refresh token not found", 401);
  }

  // Verify the refresh token signature
  let payload: TokenPayload;
  try {
    payload = verifyRefreshToken(refreshTokenFromCookie);
  } catch {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  // Find user and check stored hash
  const user = await User.findById(payload.userId).select("+refreshTokenHash");
  if (!user || !user.refreshTokenHash) {
    throw new AppError("Invalid refresh token", 401);
  }

  // Compare token with stored hash
  const isValid = await bcrypt.compare(
    refreshTokenFromCookie,
    user.refreshTokenHash
  );
  if (!isValid) {
    throw new AppError("Invalid refresh token", 401);
  }

  // Generate new access token
  const newAccessToken = generateAccessToken({
    userId: user._id.toString(),
    role: user.role,
    businessId: user.businessId.toString(),
  });

  return newAccessToken;
},
};