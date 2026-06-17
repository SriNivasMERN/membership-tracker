import { Request, Response, NextFunction } from "express";
import { auditTrailService } from "./auditTrail.service";

export const listAuditTrail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(String(req.query.page || "1"), 10);
    const limit = parseInt(String(req.query.limit || "20"), 10);
    const module = req.query.module ? String(req.query.module) : undefined;
    const action = req.query.action ? String(req.query.action) : undefined;
    const actorRole = req.query.actorRole
      ? String(req.query.actorRole)
      : undefined;
    const search = req.query.search ? String(req.query.search) : undefined;

    const result = await auditTrailService.listActions(req.user!.businessId, {
      page,
      limit,
      module,
      action,
      actorRole,
      search,
    });

    res.json({
      success: true,
      message: "Audit trail retrieved",
      data: result.entries,
      summary: result.summary,
      filteredCount: result.filteredCount,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};
