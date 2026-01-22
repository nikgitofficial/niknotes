import { NextRequest, NextResponse } from "next/server";
import { verifyToken, signAccessToken } from "@/lib/jwt";
import User from "@/models/User";
import connectDB from "@/lib/mongodb";

export async function middleware(req: NextRequest) {
  const accessToken = req.cookies.get("accessToken")?.value;
  const refreshToken = req.cookies.get("refreshToken")?.value;

  // Check if this is an API route
  const isApiRoute = req.nextUrl.pathname.startsWith("/api");

  console.log("Middleware:", {
    path: req.nextUrl.pathname,
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    isApiRoute,
  });

  // If no tokens, return appropriate response
  if (!accessToken && !refreshToken) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized - No tokens" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Try verifying access token first
  try {
    if (accessToken) {
      verifyToken(accessToken, false); // false = access token
      return NextResponse.next(); // access token valid, continue
    }
  } catch (error) {
    console.log("Access token invalid in middleware, trying refresh...");
    // access token expired, try refresh token
    if (!refreshToken) {
      if (isApiRoute) {
        return NextResponse.json({ error: "Unauthorized - No refresh token" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", req.url));
    }

    try {
      // Connect to DB to verify refresh token
      await connectDB();
      const decoded = verifyToken(refreshToken, true); // true = refresh token
      const user = await User.findById(decoded.userId);

      if (!user || user.refreshToken !== refreshToken) {
        if (isApiRoute) {
          return NextResponse.json({ error: "Unauthorized - Invalid refresh token" }, { status: 401 });
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
      
      // CRITICAL: Match the same cookie config as login
      const host = req.headers.get("host") || "";
      const isVercel = host.includes("vercel.app");
      
      const cookieConfig = {
        httpOnly: true,
        secure: true,
        sameSite: "none" as const,
        path: "/",
        maxAge: 900, // 15 minutes
      };

      // Add domain only for Vercel deployment
      if (isVercel) {
        const domain = host.split(".").slice(-2).join(".");
        Object.assign(cookieConfig, { domain: `.${domain}` });
      }

      response.cookies.set("accessToken", newAccess, cookieConfig);

      console.log("Middleware refreshed access token");
      return response;
    } catch (error) {
      console.error("Middleware refresh token error:", error);
      if (isApiRoute) {
        return NextResponse.json({ error: "Unauthorized - Token refresh failed" }, { status: 401 });
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