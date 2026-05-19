import { Request, Response, NextFunction } from "express";
import { slotService } from "./slot.service";

export const getAllSlots = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const slots = await slotService.getAllSlots(req.user!.businessId);
    res.json({ success: true, message: "Slots retrieved", data: slots });
  } catch (error) {
    next(error);
  }
};

export const getActiveSlots = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const slots = await slotService.getActiveSlots(
      req.user!.businessId
    );
    res.json({
      success: true,
      message: "Active slots retrieved",
      data: slots,
    });
  } catch (error) {
    next(error);
  }
};

export const getSlotById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const slot = await slotService.getSlotById(
      String(req.params.id),
      req.user!.businessId
    );
    res.json({ success: true, message: "Slot retrieved", data: slot });
  } catch (error) {
    next(error);
  }
};

export const createSlot = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const slot = await slotService.createSlot(
      req.user!.businessId,
      req.body
    );
    res.status(201).json({
      success: true,
      message: "Slot created successfully",
      data: slot,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSlot = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const slot = await slotService.updateSlot(
      String(req.params.id),
      req.user!.businessId,
      req.body
    );
    res.json({
      success: true,
      message: "Slot updated successfully",
      data: slot,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleSlotStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const slot = await slotService.toggleSlotStatus(
      String(req.params.id),
      req.user!.businessId,
      req.body
    );
    res.json({
      success: true,
      message: `Slot ${req.body.isActive ? "activated" : "deactivated"} successfully`,
      data: slot,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSlot = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await slotService.deleteSlot(
      String(req.params.id),
      req.user!.businessId
    );
    res.json({
      success: true,
      message: "Slot deleted successfully",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};