import mongoose from "mongoose";
import {
  BusinessSettings,
  IBusinessSettingsDocument,
} from "./settings.model";
import { AppError } from "../../middleware/error.middleware";
import {
  CreateSettingsInput,
  UpdateSettingsInput,
} from "./settings.schema";

export const settingsService = {

  // Get settings for a business
  // Returns null if not yet configured
  async getSettings(
    businessId: string
  ): Promise<IBusinessSettingsDocument | null> {
    const settings = await BusinessSettings.findOne({
      businessId: new mongoose.Types.ObjectId(businessId),
    });
    return settings;
  },

  // Create initial settings - only runs once per business
 async createSettings(
  businessId: string,
  input: CreateSettingsInput
): Promise<IBusinessSettingsDocument> {
  const existing = await this.getSettings(businessId);
  if (existing) {
    throw new AppError(
      "Settings already exist. Use update instead.",
      409
    );
  }

  const settings = await BusinessSettings.create({
    businessId: new mongoose.Types.ObjectId(businessId),
    ...input,
    isConfigured: true,
  });

  return settings;
},

  // Update existing settings
  async updateSettings(
    businessId: string,
    input: UpdateSettingsInput
  ): Promise<IBusinessSettingsDocument> {
    const settings = await BusinessSettings.findOneAndUpdate(
      { businessId: new mongoose.Types.ObjectId(businessId) },
      { $set: input },
      { new: true, runValidators: true }
    );

    if (!settings) {
      throw new AppError(
        "Settings not found. Create settings first.",
        404
      );
    }

    return settings;
  },

  // Also update the owner's businessId once settings are created
  // This replaces the placeholder businessId from registration
  async getOrCreateSettings(
    businessId: string,
    input: CreateSettingsInput
  ): Promise<IBusinessSettingsDocument> {
    const existing = await this.getSettings(businessId);
    if (existing) {
      return this.updateSettings(businessId, input);
    }
    return this.createSettings(businessId, input);
  },
};