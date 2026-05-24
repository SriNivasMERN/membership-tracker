export type UserRole = "owner" | "staff";

export interface AuthUser {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  businessId: string;
}