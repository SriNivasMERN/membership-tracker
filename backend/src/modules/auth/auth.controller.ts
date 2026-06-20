import { User } from "./user.model";
import { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service";

export const registerOwner = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
      return;
    }

    const owner = await authService.registerOwner({ name, email, password });

    res.status(201).json({
      success: true,
      message: "Owner account created successfully",
      data: owner,
    });
  } catch (error) {
    next(error);
  }
};

export const checkOwnerStatus = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const ownerExists = await authService.isOwnerRegistered();
    res.json({
      success: true,
      message: "Owner status retrieved",
      data: { ownerExists },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
      return;
    }

    const { accessToken, user } = await authService.login(
      { email, password },
      res
    );

    res.json({
      success: true,
      message: "Login successful",
      data: {
        accessToken,
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Clear refresh token from database
    if (req.user) {
      await User.findByIdAndUpdate(req.user.userId, {
        refreshTokenHash: undefined,
      });
    }

    await authService.logout(res);

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tokenFromCookie = req.cookies.refreshToken;

    const { accessToken, user } = await authService.refreshAccessToken(
      tokenFromCookie,
      res
    );

    res.json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken,
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};
