"use client";

import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Marquee from "react-fast-marquee";

export default function HomePage() {
  const router = useRouter();

  const logos = [
    "/images/textnotes.png",
    "/images/imagenotes.png",
    "/images/filenotes.png",
    "/images/videonotes.png",
  ];

  const companylogos = [
    "/company/1.png",
    "/company/2.png",
    "/company/3.png",
    "/company/4.png",
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#FDD20D] font-sans">
      <Navbar />

      <main className="flex flex-1 flex-col items-center justify-center px-4 sm:px-6 lg:px-8 text-center pt-20 sm:pt-24 pb-8">
        {/* Hero Section with Curved Images */}
        <div className="relative w-full h-64 sm:h-80 md:h-96 flex items-center justify-center mb-4 sm:mb-6">
          {/* Curved Images Behind Text */}
          <div className="absolute flex justify-center items-center w-full h-full z-0 animate-fade-up animate-delay-50">
            {logos.map((logo, i) => (
              <img
                key={i}
                src={logo}
                alt={`logo-${i}`}
                className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-1 sm:mx-2 img-glow"
                style={{
                  transform: `translateY(${i % 2 === 0 ? -30 : -40}px) rotate(${i % 2 === 0 ? -20 : 20}deg)`,
                }}
              />
            ))}
          </div>

          {/* Heading */}
          <h1 className="relative text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 z-10 text-center shimmer italic tracking-tight animate-fade-up animate-delay-100 px-4">
            Welcome to <span className="text-blue-700">NikNotes</span>
          </h1>
        </div>

        {/* Description */}
        <p className="text-gray-900 text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed md:leading-loose max-w-xs sm:max-w-xl md:max-w-2xl lg:max-w-3xl font-sans tracking-wide mb-6 sm:mb-8 md:mb-10 animate-fade-up animate-delay-150 px-4">
          <span className="font-semibold">NikNotes</span> is a sleek, secure, and professional note-taking platform that helps developers and creatives organize their ideas efficiently.  
          Save and manage <span className="font-semibold text-blue-600">text notes, image notes, file attachments, and video notes</span> in a unified workspace.  
          <span className="font-medium">Sign up or log in today to streamline your workflow and capture ideas seamlessly.</span>
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 animate-fade-up animate-delay-200 mb-8 sm:mb-10 w-full max-w-xs sm:max-w-md px-4">
          <button
            onClick={() => router.push("/login")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 sm:px-8 rounded-lg shadow-md transition-all hover:shadow-lg w-full sm:w-auto"
          >
            Login
          </button>
          <button
            onClick={() => router.push("/register")}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 sm:px-8 rounded-lg shadow-md transition-all hover:shadow-lg w-full sm:w-auto"
          >
            Register
          </button>
        </div>

        {/* Marquee Section */}
        <div className="w-full py-4 sm:py-6 overflow-hidden">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 italic px-4">
            Our Trusted Partners
          </h2>

          <Marquee
            speed={50}
            pauseOnHover={true}
            gradient={false}
            className="flex items-center overflow-hidden"
          >
            {companylogos.map((logo, i) => (
              <img
                key={i}
                src={logo}
                alt={`partner-${i}`}
                className="h-12 sm:h-14 md:h-16 mx-4 sm:mx-6 opacity-80 transition-transform hover:scale-110 sm:hover:scale-125 hover:opacity-100"
                style={{ pointerEvents: "none" }}
              />
            ))}
          </Marquee>
          
        </div>
      </main>

      <Footer />
    </div>
  );
}