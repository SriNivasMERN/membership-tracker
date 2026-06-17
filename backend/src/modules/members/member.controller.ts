import { Request, Response, NextFunction } from "express";
import { memberService } from "./member.service";

export const createMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const member = await memberService.createMember(
      req.user!.businessId,
      req.user!.userId,
      req.body
    );
    res.status(201).json({
      success: true,
      message: "Member created successfully",
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

export const listMembers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(String(req.query.page || "1"));
    const limit = parseInt(String(req.query.limit || "10"));
    const search = String(req.query.search || "");
    const planId = req.query.planId ? String(req.query.planId) : undefined;
    const status = req.query.status ? String(req.query.status) : undefined;
    const hasPending = req.query.hasPending === "true" ? true : undefined;
    const fullyPaid = req.query.fullyPaid === "true" ? true : undefined;

    const result = await memberService.listMembers(
      req.user!.businessId,
      { page, limit, search, planId, status, hasPending, fullyPaid }
    );

    res.json({
      success: true,
      message: "Members retrieved",
      data: result.members,
      summary: result.summary,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getMemberById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const member = await memberService.getMemberById(
      String(req.params.id),
      req.user!.businessId
    );
    res.json({
      success: true,
      message: "Member retrieved",
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const member = await memberService.updateMember(
      String(req.params.id),
      req.user!.businessId,
      req.user!.userId,
      req.body
    );
    res.json({
      success: true,
      message: "Member updated successfully",
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await memberService.deleteMember(
      String(req.params.id),
      req.user!.businessId,
      req.user!.userId
    );
    res.json({
      success: true,
      message: "Member deleted successfully",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

export const addPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const member = await memberService.addPayment(
      String(req.params.id),
      req.user!.businessId,
      req.user!.userId,
      req.body
    );
    res.json({
      success: true,
      message: "Payment recorded successfully",
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

export const renewMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const member = await memberService.renewMember(
      String(req.params.id),
      req.user!.businessId,
      req.user!.userId,
      req.body
    );
    res.json({
      success: true,
      message: "Membership renewed successfully",
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

export const endMembership = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const member = await memberService.endMembership(
      String(req.params.id),
      req.user!.businessId,
      req.user!.userId,
      req.body
    );
    res.json({
      success: true,
      message: "Membership ended successfully",
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

export const revertEndMembership = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const member = await memberService.revertEndMembership(
      String(req.params.id),
      req.user!.businessId,
      req.user!.userId,
      req.body
    );
    res.json({
      success: true,
      message: "Membership end reverted successfully",
      data: member,
    });
  } catch (error) {
    next(error);
  }
};
