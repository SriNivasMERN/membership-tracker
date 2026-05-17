import jwt from "jsonwebtoken";
import { config } from "../config/env";

// Shape of data stored inside the token
export interface TokenPayload {
  userId: string;
  role: string;
  businessId: string;
}

// Generate a short-lived access token - 15 minutes
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwtAccessSecret, {
    expiresIn: "15m",
  });
};

// Generate a long-lived refresh token - 7 days
export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwtRefreshSecret, {
    expiresIn: "7d",
  });
};

// Verify an access token - returns payload or throws error
export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwtAccessSecret) as TokenPayload;
};

// Verify a refresh token - returns payload or throws error
export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwtRefreshSecret) as TokenPayload;
};