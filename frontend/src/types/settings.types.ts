export type BusinessType =
  | "gym"
  | "yoga_studio"
  | "coaching_center"
  | "library"
  | "sports_facility"
  | "clinic"
  | "other";

export interface Terminology {
  planLabel: string;
  slotLabel: string;
  memberLabel: string;
}

export interface BusinessSettings {
  _id: string;
  businessId: string;
  businessName: string;
  businessType: BusinessType;
  email?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  terminology: Terminology;
  expiryAlertDays: number;
  isConfigured: boolean;
}