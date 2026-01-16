"use client";

import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-[#FDD20D]">
      <Navbar />

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center space-y-8">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-800 animate-fade-up animate-delay-50 mb-6">
          About NikNotes
        </h1>

        <p className="text-gray-600 text-lg md:text-xl animate-fade-up animate-delay-100 max-w-2xl">
          NikNotes is a modern, secure note-taking app designed to help you
          organize your thoughts, tasks, and ideas effortlessly. With cloud
          sync, real-time updates, and a simple interface, you can focus on
          what matters most.
        </p>

        <p className="text-gray-600 text-lg md:text-xl animate-fade-up animate-delay-150 max-w-2xl">
          Our mission is to provide a reliable and intuitive platform for
          everyone — whether you're a student, professional, or creative
          thinker — to capture, manage, and revisit your notes anytime,
          anywhere.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 animate-fade-up animate-delay-200">
          <button
            onClick={() => router.push("/register")}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-all hover:shadow-lg"
          >
            Get Started
          </button>
          <button
            onClick={() => router.push("/contact")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-all hover:shadow-lg"
          >
            Contact Us
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
