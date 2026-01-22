import { NextRequest, NextResponse } from "next/server";
import { verifyToken, signAccessToken, JWTPayload } from "@/lib/jwt";
import User from "@/models/User";
import connectDB from "@/lib/mongodb";

export async function middleware(req: NextRequest) {
  const accessToken = req.cookies.get("accessToken")?.value;
  const refreshToken = req.cookies.get("refreshToken")?.value;

  // No tokens -> login
  if (!accessToken && !refreshToken) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    if (accessToken) {
      verifyToken(accessToken); // valid
      return NextResponse.next();
    }
  } catch {
    if (!refreshToken) return NextResponse.redirect(new URL("/login", req.url));

    try {
      await connectDB();
      const decoded: JWTPayload = verifyToken(refreshToken, true);
      const user = await User.findById(decoded.userId);

      if (!user || user.refreshToken !== refreshToken) {
        return NextResponse.redirect(new URL("/login", req.url));
      }

      const newAccess = signAccessToken({
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
      });

      const response = NextResponse.next();
      response.cookies.set("accessToken", newAccess, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
        maxAge: 900,
      });

      return response;
    } catch (err) {
      console.error("Refresh token failed:", err);
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/notes/:path*"],
};
