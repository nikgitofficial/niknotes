import { NextRequest, NextResponse } from "next/server";
import { verifyToken, signAccessToken, JWTPayload } from "@/lib/jwt";
import User from "@/models/User";
import connectDB from "@/lib/mongodb";

// Middleware to protect /dashboard routes
export async function middleware(req: NextRequest) {
  const accessToken = req.cookies.get("accessToken")?.value;
  const refreshToken = req.cookies.get("refreshToken")?.value;

  // If no tokens, redirect to login
  if (!accessToken && !refreshToken) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Verify access token first
  try {
    if (accessToken) {
      verifyToken(accessToken); // throws if invalid/expired
      return NextResponse.next();
    }
  } catch {
    // Access token invalid or expired, try refresh token
    if (!refreshToken) return NextResponse.redirect(new URL("/login", req.url));

    try {
      await connectDB();

      const decoded: JWTPayload = verifyToken(refreshToken, true); // true = refresh token
      const user = await User.findById(decoded.userId);

      if (!user || user.refreshToken !== refreshToken) {
        return NextResponse.redirect(new URL("/login", req.url));
      }

      // Issue new access token
      const newAccess = signAccessToken({
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
      });

      const response = NextResponse.next();

      // Set cookie with environment-safe options
      response.cookies.set("accessToken", newAccess, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // false in dev
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
        maxAge: 900, // 15 minutes
      });

      return response;
    } catch (err) {
      console.error("Refresh token failed:", err);
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Fallback redirect
  return NextResponse.redirect(new URL("/login", req.url));
}

// Apply middleware only to /dashboard routes
export const config = {
  matcher: ["/dashboard/:path*"],
};
