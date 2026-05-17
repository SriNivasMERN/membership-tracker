import { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service";

// registerOwner handles POST /api/auth/register-owner
// It receives the request, calls the service, sends the response
// It does NOT contain any business logic itself
export const registerOwner = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    // Basic presence check - full Zod validation comes on Day 5
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
      // Note: password and refreshTokenHash are automatically
      // removed by the toJSON transform we set up on Day 2
    });
  } catch (error) {
    // Pass error to centralized error handler we built on Day 2
    next(error);
  }
};

// checkOwnerStatus handles GET /api/auth/owner-status
// Frontend uses this on first load to decide whether to show setup screen
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
