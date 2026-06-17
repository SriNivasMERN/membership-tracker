export type AuditModule =
  | "members"
  | "plans"
  | "slots"
  | "pricing"
  | "users"
  | "settings";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "activate"
  | "deactivate"
  | "payment"
  | "renew"
  | "end"
  | "revert"
  | "credentials"
  | "save";

export interface AuditTrailEntry {
  _id: string;
  businessId: string;
  module: AuditModule;
  action: AuditAction;
  entityId?: string;
  entityLabel?: string;
  description?: string;
  performedBy: {
    userId: string;
    name: string;
    role: "owner" | "staff";
  };
  createdAt: string;
}

export interface AuditTrailSummary {
  total: number;
  today: number;
  ownerActions: number;
  staffActions: number;
}
