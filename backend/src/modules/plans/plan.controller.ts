import { Request, Response, NextFunction } from "express";
import { planService } from "./plan.service";
import { logAuditAction } from "../auditTrail/auditTrail.utils";

export const getAllPlans = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const plans = await planService.getAllPlans(req.user!.businessId);
    res.json({
      success: true,
      message: "Plans retrieved",
      data: plans,
    });
  } catch (error) {
    next(error);
  }
};

export const getActivePlans = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const plans = await planService.getActivePlans(
      req.user!.businessId
    );
    res.json({
      success: true,
      message: "Active plans retrieved",
      data: plans,
    });
  } catch (error) {
    next(error);
  }
};

export const getPlanById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const plan = await planService.getPlanById(
      String(req.params.id),
      req.user!.businessId
    );
    res.json({
      success: true,
      message: "Plan retrieved",
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};

export const createPlan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const plan = await planService.createPlan(
      req.user!.businessId,
      req.body
    );
    logAuditAction(req.user!, {
      module: "plans",
      action: "create",
      entityId: String(plan._id),
      entityLabel: plan.name,
      description: `Created plan ${plan.name}`,
    });
    res.status(201).json({
      success: true,
      message: "Plan created successfully",
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePlan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const plan = await planService.updatePlan(
      String(req.params.id),
      req.user!.businessId,
      req.body
    );
    logAuditAction(req.user!, {
      module: "plans",
      action: "update",
      entityId: String(plan._id),
      entityLabel: plan.name,
      description: `Updated plan ${plan.name}`,
    });
    res.json({
      success: true,
      message: "Plan updated successfully",
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};

export const togglePlanStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const plan = await planService.togglePlanStatus(
      String(req.params.id),
      req.user!.businessId,
      req.body
    );
    logAuditAction(req.user!, {
      module: "plans",
      action: req.body.isActive ? "activate" : "deactivate",
      entityId: String(plan._id),
      entityLabel: plan.name,
      description: `${req.body.isActive ? "Activated" : "Deactivated"} plan ${plan.name}`,
    });
    res.json({
      success: true,
      message: `Plan ${req.body.isActive ? "activated" : "deactivated"} successfully`,
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};

export const deletePlan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await planService.deletePlan(
      String(req.params.id),
      req.user!.businessId
    );
    logAuditAction(req.user!, {
      module: "plans",
      action: "delete",
      entityId: String(req.params.id),
      description: "Deleted plan",
    });
    res.json({
      success: true,
      message: "Plan deleted successfully",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
