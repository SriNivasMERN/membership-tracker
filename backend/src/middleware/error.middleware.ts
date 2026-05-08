import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      data: null,
    });
    return;
  }

  const mongoError = err as { code?: number };
  if (mongoError.code === 11000) {
    res.status(409).json({
      success: false,
      message: "A record with this value already exists",
      data: null,
    });
    return;
  }

  console.error("Unexpected error:", err);
  res.status(500).json({
    success: false,
    message: "Something went wrong. Please try again.",
    data: null,
  });
};