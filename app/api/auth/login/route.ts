// ===== /api/auth/login/route.ts =====
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const payload = { userId: user._id.toString(), email: user.email, name: user.name };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    user.refreshToken = refreshToken;
    await user.save();

    const res = NextResponse.json({ 
      message: "Login success",
      user: {
        email: user.email,
        name: user.name,
        _id: user._id.toString(),
      }
    });

    // CRITICAL: Get the host from the request
    const host = req.headers.get("host") || "";
    const isVercel = host.includes("vercel.app");
    
    // Cookie configuration
    const cookieConfig = {
      httpOnly: true,
      secure: true,
      sameSite: "none" as const,
      path: "/",
    };

    // Add domain only for Vercel deployment
    if (isVercel) {
      const domain = host.split(".").slice(-2).join("."); // Gets "vercel.app"
      Object.assign(cookieConfig, { domain: `.${domain}` });
    }

    console.log("Setting cookies with config:", { host, isVercel, cookieConfig });

    res.cookies.set("accessToken", accessToken, {
      ...cookieConfig,
      maxAge: 900, // 15 minutes
    });

    res.cookies.set("refreshToken", refreshToken, {
      ...cookieConfig,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return res;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

