"use client";

import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-[#FDD20D]">
      <Navbar />

      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-800 mb-6 animate-fade-up">
          Welcome to NikNotes
        </h1>
        <p className="text-gray-600 text-lg md:text-xl mb-10 animate-fade-up animate-delay-100">
          A modern, secure note-taking app. Login or register to get started.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 animate-fade-up animate-delay-200">
          <button
            onClick={() => router.push("/login")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-all hover:shadow-lg"
          >
            Login
          </button>
          <button
            onClick={() => router.push("/register")}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-all hover:shadow-lg"
          >
            Register
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
