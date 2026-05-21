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

    const result = await memberService.listMembers(
      req.user!.businessId,
      { page, limit, search }
    );

    res.json({
      success: true,
      message: "Members retrieved",
      data: result.members,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};