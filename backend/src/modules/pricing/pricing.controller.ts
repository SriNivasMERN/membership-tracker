import { Request, Response, NextFunction } from "express";
import { pricingService } from "./pricing.service";

export const getAllRules = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rules = await pricingService.getAllRules(
      req.user!.businessId
    );
    res.json({
      success: true,
      message: "Pricing rules retrieved",
      data: rules,
    });
  } catch (error) {
    next(error);
  }
};

export const getRuleById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rule = await pricingService.getRuleById(
      String(req.params.id),
      req.user!.businessId
    );
    res.json({
      success: true,
      message: "Pricing rule retrieved",
      data: rule,
    });
  } catch (error) {
    next(error);
  }
};

export const createRule = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rule = await pricingService.createRule(
      req.user!.businessId,
      req.body
    );
    res.status(201).json({
      success: true,
      message: "Pricing rule created successfully",
      data: rule,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRule = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rule = await pricingService.updateRule(
      String(req.params.id),
      req.user!.businessId,
      req.body
    );
    res.json({
      success: true,
      message: "Pricing rule updated successfully",
      data: rule,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRule = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await pricingService.deleteRule(
      String(req.params.id),
      req.user!.businessId
    );
    res.json({
      success: true,
      message: "Pricing rule deleted successfully",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// Calculate price preview - useful for frontend to show price before saving member
export const calculatePrice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { planId, slotId, basePrice } = req.body;
    const finalPrice = await pricingService.calculateFinalPrice(
      req.user!.businessId,
      planId,
      slotId,
      basePrice
    );
    res.json({
      success: true,
      message: "Price calculated",
      data: { finalPrice },
    });
  } catch (error) {
    next(error);
  }
};