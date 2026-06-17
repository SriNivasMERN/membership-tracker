import { RequestUser } from "../../types/shared.types";
import { AuditAction, AuditModule } from "./auditTrail.model";
import { auditTrailService } from "./auditTrail.service";

interface AuditActionPayload {
  module: AuditModule;
  action: AuditAction;
  entityId?: string;
  entityLabel?: string;
  description?: string;
}

export function logAuditAction(
  user: RequestUser,
  payload: AuditActionPayload
): void {
  void auditTrailService
    .recordAction({
      businessId: user.businessId,
      performedByUserId: user.userId,
      module: payload.module,
      action: payload.action,
      entityId: payload.entityId,
      entityLabel: payload.entityLabel,
      description: payload.description,
    })
    .catch((error) => {
      console.error("Audit trail logging failed:", error);
    });
}
