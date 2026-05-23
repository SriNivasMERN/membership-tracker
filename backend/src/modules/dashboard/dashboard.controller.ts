import { Request, Response, NextFunction } from "express";
import { dashboardService } from "./dashboard.service";

export const getDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await dashboardService.getDashboardData(
      req.user!.businessId
    );
    res.json({
      success: true,
      message: "Dashboard data retrieved",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getMonthlyRevenue = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await dashboardService.getMonthlyRevenue(
      req.user!.businessId
    );
    res.json({
      success: true,
      message: "Monthly revenue retrieved",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getPlanDistribution = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await dashboardService.getPlanDistribution(
      req.user!.businessId
    );
    res.json({
      success: true,
      message: "Plan distribution retrieved",
      data,
    });
  } catch (error) {
    next(error);
  }
};