export interface Slot {
  _id: string;
  label: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SlotFormData {
  label: string;
  startTime: string;
  endTime: string;
}