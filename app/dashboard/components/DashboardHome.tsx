"use client";

import { useEffect, useState } from "react";

type Props = {
  user: {
    email: string;
    name: string;
  };
};

export default function DashboardHome({ user }: Props) {
  const [totalTextNotes, setTotalTextNotes] = useState(0);
  const [totalImageNotes, setTotalImageNotes] = useState(0);
  const [totalFileNotes, setTotalFileNotes] = useState(0);
  const [totalVideoNotes, setTotalVideoNotes] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [textRes, imageRes, fileRes, videoRes] = await Promise.all([
          fetch("/api/notes/text", { credentials: "include" }),
          fetch("/api/notes/image", { credentials: "include" }),
          fetch("/api/notes/file", { credentials: "include" }),
          fetch("/api/notes/video", { credentials: "include" }),
        ]);

        if (textRes.ok) {
          const textData = await textRes.json();
          setTotalTextNotes(textData.notes.length);
        }

        if (imageRes.ok) {
          const imageData = await imageRes.json();
          setTotalImageNotes(imageData.notes.length);
        }

        if (fileRes.ok) {
          const fileData = await fileRes.json();
          setTotalFileNotes(fileData.notes.length);
        }

        if (videoRes.ok) {
          const videoData = await videoRes.json();
          setTotalVideoNotes(videoData.length);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard counts", err);
      }
    };

    fetchCounts();
  }, []);

  return (
    <>
      <h2 className="text-xl sm:text-2xl font-bold text-green-800 mb-4 sm:mb-6">
        Dashboard
      </h2>

      <div className="
        grid
        grid-cols-1
        sm:grid-cols-2
        md:grid-cols-3
        lg:grid-cols-4
        xl:grid-cols-6
        gap-4 sm:gap-5 md:gap-6
      ">
        {/* Email */}
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow col-span-1 sm:col-span-2 xl:col-span-2 break-words">
          <p className="text-xs sm:text-sm text-gray-600">Email</p>
          <p className="text-sm sm:text-lg font-semibold text-black">{user.email}</p>
        </div>

        {/* Name */}
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow col-span-1 sm:col-span-2 xl:col-span-2 break-words">
          <p className="text-xs sm:text-sm text-gray-600">Name</p>
          <p className="text-sm sm:text-lg font-semibold text-black">{user.name}</p>
        </div>

        {/* Last Login */}
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow col-span-1">
          <p className="text-xs sm:text-sm text-gray-600">Last Login</p>
          <p className="text-sm sm:text-lg font-semibold text-black">Today</p>
        </div>
        <br />

        {/* Text */}
        <StatCard label="Text Notes" value={totalTextNotes} />

        {/* Image */}
        <StatCard label="Image Notes" value={totalImageNotes} />

        {/* File */}
        <StatCard label="File Notes" value={totalFileNotes} />

        {/* Video */}
        <StatCard label="Video Notes" value={totalVideoNotes} />
      </div>
    </>
  );
}

/* Small reusable stat card with auto logo */
function StatCard({ label, value }: { label: string; value: number }) {
  // map label to logo path in /public/images
  const logoMap: Record<string, string> = {
    "Text Notes": "/images/textnotes.png",
    "Image Notes": "/images/imagenotes.png",
    "File Notes": "/images/filenotes.png",
    "Video Notes": "/images/videonotes.png",
  };

  const logo = logoMap[label] || "/images/default.png"; // fallback logo

  return (
    <div className="bg-white p-3 sm:p-4 rounded-lg shadow text-center flex flex-col items-center gap-2
                    col-span-1">
      <img
        src={logo}
        alt={`${label} logo`}
        className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
      />
      <p className="text-xs sm:text-sm text-gray-600 truncate">Total {label}</p>
      <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-700">{value}</p>
    </div>
  );
}
