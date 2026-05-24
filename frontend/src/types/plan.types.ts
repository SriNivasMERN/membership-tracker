export interface Plan {
  _id: string;
  businessId: string;
  name: string;
  description?: string;
  durationDays: number;
  basePrice: number;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}