export type UserRole = "owner" | "staff";

export type MemberStatus = "active" | "expiring_soon" | "expired" | "ended";

export interface RequestUser {
  userId: string;
  role: UserRole;
  businessId: string;
}
