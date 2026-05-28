export interface Plan {
  _id: string;
  name: string;
  durationDays: number;
  basePrice: number;
  description?: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlanFormData {
  name: string;
  durationDays: number;
  basePrice: number;
  description?: string;
}