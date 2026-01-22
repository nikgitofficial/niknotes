import { NextRequest, NextResponse } from "next/server";
import { verifyToken, signAccessToken } from "@/lib/jwt";
import User from "@/models/User";
import connectDB from "@/lib/mongodb";

export async function middleware(req: NextRequest) {
  const accessToken = req.cookies.get("accessToken")?.value;
  const refreshToken = req.cookies.get("refreshToken")?.value;

  // Check if this is an API route
  const isApiRoute = req.nextUrl.pathname.startsWith("/api");

  // If no tokens, return appropriate response
  if (!accessToken && !refreshToken) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
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
      if (isApiRoute) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", req.url));
    }

    try {
      // Connect to DB to verify refresh token
      await connectDB();
      const decoded = verifyToken(refreshToken, true); // pass true for refresh token
      const user = await User.findById(decoded.userId);

      if (!user || user.refreshToken !== refreshToken) {
        if (isApiRoute) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
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
        sameSite: "lax",
        path: "/",
        maxAge: 900, // 15 minutes
      });

      return response;
    } catch (error) {
      console.error("Refresh token error:", error);
      if (isApiRoute) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // This should never be reached, but just in case
  if (isApiRoute) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/notes/:path*", // Protect API routes too
  ],
};