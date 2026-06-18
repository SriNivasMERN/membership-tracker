export type MemberStatus = "active" | "expiring_soon" | "expired" | "ended";
export type PaymentMethod = "cash" | "upi" | "card";

export interface PlanSnapshot {
  planId: string;
  name: string;
  durationDays: number;
  basePrice: number;
}

export interface SlotSnapshot {
  slotId: string;
  label: string;
  startTime: string;
  endTime: string;
}

export interface PaymentEntry {
  _id: string;
  amount: number;
  paidOn: string;
  paymentMethod?: PaymentMethod;
  note?: string;
  recordedBy: string;
}

export interface MembershipClosure {
  endedOn: string;
  originalEndDate?: string;
  originalCreditBalance?: number;
  usedValue: number;
  settlementDeduction: number;
  refundableBalance: number;
  payableBalance: number;
  note?: string;
  closedBy: string;
}

export interface Member {
  _id: string;
  businessId: string;
  name: string;
  mobile: string;
  email?: string;
  photo?: string;
  planSnapshot: PlanSnapshot;
  slotSnapshot: SlotSnapshot;
  startDate: string;
  endDate: string;
  finalPrice: number;
  creditBalance?: number;
  payments: PaymentEntry[];
  membershipClosure?: MembershipClosure;
  notes?: string;
  isDeleted: boolean;
  status: MemberStatus;
  paidAmount: number;
  pendingAmount: number;
  createdAt: string;
  updatedAt: string;
}
