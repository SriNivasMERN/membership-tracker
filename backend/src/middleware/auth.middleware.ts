import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/token.utils";
import { AppError } from "./error.middleware";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Check for Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Access token required", 401);
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.split(" ")[1];

    // Verify token - throws if invalid or expired
    const payload = verifyAccessToken(token);

    // Attach user info to request - available in all route handlers
    req.user = {
      userId: payload.userId,
      role: payload.role as "owner" | "staff",
      businessId: payload.businessId,
    };

    next();
  } catch (error) {
    next(new AppError("Invalid or expired access token", 401));
  }
};