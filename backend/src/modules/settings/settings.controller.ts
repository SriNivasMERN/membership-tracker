import { Request, Response, NextFunction } from "express";
import { settingsService } from "./settings.service";

export const getSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const settings = await settingsService.getSettings(
      req.user!.businessId
    );

    res.json({
      success: true,
      message: settings
        ? "Settings retrieved"
        : "Settings not yet configured",
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

export const saveSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const settings = await settingsService.getOrCreateSettings(
      req.user!.businessId,
      req.body
    );

    res.json({
      success: true,
      message: "Settings saved successfully",
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const settings = await settingsService.updateSettings(
      req.user!.businessId,
      req.body
    );

    res.json({
      success: true,
      message: "Settings updated successfully",
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};