import { Request, Response, NextFunction } from "express";
import { userService } from "./user.service";

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const users = await userService.getAllUsers(req.user!.businessId);
    res.json({
      success: true,
      message: "Users retrieved",
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await userService.getUserById(
      String(req.params.id),
      req.user!.businessId
    );
    res.json({
      success: true,
      message: "User retrieved",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await userService.getCurrentUser(req.user!.userId);
    res.json({
      success: true,
      message: "Profile retrieved",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await userService.createUser(
      req.user!.businessId,
      req.body
    );
    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await userService.updateUser(
      String(req.params.id),
      req.user!.businessId,
      req.body
    );
    res.json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleUserStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await userService.toggleUserStatus(
      String(req.params.id),
      req.user!.businessId,
      req.body,
      req.user!.userId
    );
    res.json({
      success: true,
      message: `User ${req.body.isActive ? "activated" : "deactivated"} successfully`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// NEW - update email and/or password for a staff user
export const updateCredentials = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await userService.updateCredentials(
      String(req.params.id),
      req.user!.businessId,
      req.body
    );
    res.json({
      success: true,
      message: "Credentials updated successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};