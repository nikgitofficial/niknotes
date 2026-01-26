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

    
    <main className="flex flex-1 flex-col items-center justify-center px-4 text-center pt-24">
        <div className="relative w-full h-96 flex items-center justify-center">
          {/* Curved Images Behind Text */}
          <div className="absolute flex justify-center items-center w-full h-full z-0 animate-fade-up animate-delay-50">
            {logos.map((logo, i) => (
              <img
                key={i}
                src={logo}
                alt={`logo-${i}`}
                className="w-24 h-24 mx-2 img-glow"
                style={{
                  transform: `translateY(${i % 2 === 0 ? -40 : -60}px) rotate(${i % 2 === 0 ? -20 : 20}deg)`,
                }}
              />
            ))}
          </div>

          {/* Heading */}
          <h1 className="relative text-5xl md:text-6xl font-extrabold text-gray-900 z-10 text-center shimmer italic tracking-tight animate-fade-up animate-delay-100">
            Welcome to <span className="text-blue-700">NikNotes</span>
          </h1>
        </div>

        {/* Description */}
        <p className="text-gray-900 text-base md:text-lg lg:text-xl leading-relaxed md:leading-loose max-w-3xl font-sans tracking-wide mb-10 animate-fade-up animate-delay-150">
          <span className="font-semibold">NikNotes</span> is a sleek, secure, and professional note-taking platform that helps developers and creatives organize their ideas efficiently.  
          Save and manage <span className="font-semibold text-blue-600">text notes, image notes, file attachments, and video notes</span> in a unified workspace.  
          <span className="font-medium">Sign up or log in today to streamline your workflow and capture ideas seamlessly.</span>
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 animate-fade-up animate-delay-200 mb-10">
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

      {/* Marquee Section */}
<div className="w-full py-6 overflow-hidden">
  <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 italic">
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
        className="h-16 mx-6 opacity-80 transition-transform hover:scale-125 hover:opacity-100"
        style={{ pointerEvents: "none" }} // prevent accidental scroll on click
      />
    ))}
  </Marquee>
</div>

      </main>

      <Footer />
    </div>
  );
}
