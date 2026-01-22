"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HiEye, HiEyeOff } from "react-icons/hi";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.email || !form.password) {
      setError("Please enter both email and password");
      return;
    }

    setLoading(true);
    
    console.log("=== FRONTEND LOGIN START ===");
    console.log("Attempting login for:", form.email);
    
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ⭐ CRITICAL: This is required for cookies!
        body: JSON.stringify(form),
      });

      console.log("Login response status:", res.status);
      console.log("Response headers:", Object.fromEntries(res.headers.entries()));

      if (!res.ok) {
        const data = await res.json();
        console.error("Login failed:", data);
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      const data = await res.json();
      console.log("Login successful!", data);
      console.log("Cookies after login:", document.cookie);
      
      // Small delay to ensure cookies are set
      setTimeout(() => {
        console.log("Cookies after 100ms:", document.cookie);
        console.log("=== FRONTEND LOGIN END ===");
        router.push("/dashboard");
      }, 100);
      
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-white shadow-2xl rounded-3xl p-8 md:p-10 animate-fade-in">

          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img
              src="/images/logov3.png"
              alt="Logo"
              className="h-16 w-16 md:h-20 md:w-20 object-contain"
            />
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6 text-center">
            Login to Your Account
          </h2>

          {error && (
            <p className="text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg mb-5 text-center text-sm md:text-base animate-pulse">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-300 bg-white placeholder-gray-400 text-gray-900 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              required
            />

            {/* Password field with show/hide toggle */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border border-gray-300 bg-white placeholder-gray-400 text-gray-900 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {showPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="mt-6 text-center text-gray-500 text-sm md:text-base space-y-2">
            <p>
              Don't have an account?{" "}
              <a
                href="/register"
                className="text-blue-600 hover:underline font-medium"
              >
                Sign Up
              </a>
            </p>
            <p>
              Forgot password{" "}
              <a
                href="/forgot-password"
                className="text-blue-600 hover:underline font-medium"
              >
                click here
              </a>
            </p>
            <p>
              <a
                href="/"
                className="text-blue-600 hover:underline font-medium"
              >
                Back to Home
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}