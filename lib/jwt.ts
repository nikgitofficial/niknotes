import jwt from "jsonwebtoken";

export type JWTPayload = {
  userId: string;
  email: string;
};

const ACCESS_EXPIRES = "15m";
const REFRESH_EXPIRES = "7d";

export function signAccessToken(payload: JWTPayload) {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: ACCESS_EXPIRES,
  });
}

export function signRefreshToken(payload: JWTPayload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: REFRESH_EXPIRES,
  });
}

export function verifyToken(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
}
