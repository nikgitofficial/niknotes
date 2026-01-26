"use client";

import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-[#FDD20D] font-sans">
      <Navbar />

      {/* Add padding-top to avoid overlapping the navbar */}
      <main className="flex flex-1 flex-col items-center justify-start px-4 pt-24 md:pt-32 pb-16 text-center space-y-10">
        {/* Heading */}
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 animate-fade-up animate-delay-50 mb-6 tracking-tight italic">
          About <span className="text-blue-700">NikNotes</span>
        </h1>

        {/* Paragraphs */}
        <p className="text-gray-900 text-base md:text-lg lg:text-xl leading-relaxed md:leading-loose max-w-3xl tracking-wide animate-fade-up animate-delay-100">
          <span className="font-semibold">NikNotes</span> is a modern, secure note-taking platform designed to help professionals, students, and creatives organize their thoughts, tasks, and ideas with ease.  
          With <span className="font-medium text-blue-600">cloud sync, real-time collaboration, and an intuitive interface</span>, you can focus on what matters most without distractions.
        </p>

        <p className="text-gray-900 text-base md:text-lg lg:text-xl leading-relaxed md:leading-loose max-w-3xl tracking-wide animate-fade-up animate-delay-150">
          Our mission is to provide a reliable, efficient, and professional-grade platform where you can <span className="font-semibold">capture, manage, and revisit your notes anytime, anywhere</span>.  
          NikNotes adapts to your workflow, whether you’re a developer, designer, student, or creative thinker.
        </p>

        {/* Action Buttons */}
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
