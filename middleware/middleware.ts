import { NextRequest, NextResponse } from "next/server";
import { verifyToken, signAccessToken } from "@/lib/jwt";
import User from "@/models/User";
import connectDB from "@/lib/mongodb";

export async function middleware(req: NextRequest) {
  const accessToken = req.cookies.get("accessToken")?.value;
  const refreshToken = req.cookies.get("refreshToken")?.value;

  // If no tokens, redirect to login
  if (!accessToken && !refreshToken) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Try verifying access token first
  try {
    if (accessToken) {
      verifyToken(accessToken);
      return NextResponse.next(); // access token valid, continue
    }
  } catch {
    // access token expired, try refresh token
    if (!refreshToken) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    try {
      // Connect to DB to verify refresh token
      await connectDB();
      const decoded = verifyToken(refreshToken); // use JWT refresh secret if needed
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
      response.cookies.set("accessToken", newAccess, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 900, // 15 minutes
      });

      return response;
    } catch {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  matcher: ["/dashboard/:path*"], // protect dashboard routes
};
