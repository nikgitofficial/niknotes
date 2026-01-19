"use client";

import { useEffect, useState } from "react";
import {
  HiHome,
  HiUser,
  HiCog,
  HiOutlineDocumentText,
  HiOutlinePhotograph,
  HiOutlinePaperClip,
} from "react-icons/hi";
import LogoutButton from "@/components/LogoutButton";

// Components
import TextNotes from "./components/TextNotes";
import ImageNotes from "./components/ImageNotes";
import FileNotes from "./components/FileNotes";
import VideoNotes from "./components/VideoNotes";

type User = {
  email: string;
  name: string;
  _id?: string;
  photoUrl?: string;
};

export default function DashboardSPA() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState<
    "dashboard" | "text-notes" | "image-notes" | "file-notes" | "profile" | "settings"
  >("dashboard");

  // Fetch user info
  const fetchUser = async () => {
    try {
      let res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.status === 401) {
        const refreshRes = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        });
        if (refreshRes.ok) res = await fetch("/api/auth/me", { credentials: "include" });
        else {
          setUser(null);
          return;
        }
      }
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = await res.json();
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  if (loading) return <p className="p-8">Loading...</p>;
  if (!user) return <p className="p-8">Unauthorized. Please login.</p>;

  const navItems = [
    { name: "Home", icon: <HiHome size={20} />, key: "dashboard" },
    { name: "Text Notes", icon: <HiOutlineDocumentText size={20} />, key: "text-notes" },
    { name: "Image Notes", icon: <HiOutlinePhotograph size={20} />, key: "image-notes" },
    { name: "File Notes", icon: <HiOutlinePaperClip size={20} />, key: "file-notes" },
    { name: "Video Notes", icon: <HiOutlinePhotograph size={20} />, key: "video-notes" },
    { name: "Profile", icon: <HiUser size={20} />, key: "profile" },
    { name: "Settings", icon: <HiCog size={20} />, key: "settings" },
  ];

  // Upload profile photo and force instant update
  const handlePhotoUpload = async (file: File) => {
    if (!file || !user._id) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/user/photo", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();
      if (res.ok && data.photo) {
        // Add timestamp to bypass cache
        const updatedUrl = `${data.photo}?t=${new Date().getTime()}`;
        setUser((prev) => (prev ? { ...prev, photoUrl: updatedUrl } : prev));
      } else {
        alert(data.error || "Failed to upload profile picture");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload profile picture");
    }
  };

  // Render page based on sidebar selection
  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return (
          <>
            <h2 className="text-2xl font-bold text-green-800 mb-4">Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-black">Email</p>
                <p className="text-lg font-semibold text-black">{user.email}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-black">Name</p>
                <p className="text-lg font-semibold text-black">{user.name}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-black">Last Login</p>
                <p className="text-lg font-semibold text-black">Today</p>
              </div>
            </div>
            <p className="mt-6 text-gray-600">Select a note type from the sidebar.</p>
          </>
        );
      case "text-notes":
        return <TextNotes />;
      case "image-notes":
        return <ImageNotes />;
      case "file-notes":
        return <FileNotes />;
      case "video-notes":
        return <VideoNotes />;
      case "profile":
        return (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Profile</h2>
            <div className="flex flex-col items-center gap-4">
              <img
                src={user.photoUrl || "https://via.placeholder.com/150"}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-2 border-green-700"
              />
            </div>
          </div>
        );
      case "settings":
        return <div className="p-6">Settings Page</div>;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300
        md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative`}
      >
        <div className="flex flex-col items-center justify-center h-32 border-b p-2 relative">
          <img src="/images/logov3.png" alt="NikNotes Logo" className="h-10 w-10 mb-1" />

          {/* Profile Picture with Upload */}
          <div className="relative">
            <img
              src={user.photoUrl || "https://via.placeholder.com/150"}
              alt="Profile"
              className="h-12 w-12 rounded-full border-2 border-green-700 object-cover"
            />

            {/* Camera Icon Overlay */}
            <label className="absolute bottom-0 right-0 bg-green-700 p-1 rounded-full cursor-pointer hover:bg-green-800">
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  handlePhotoUpload(file!);
                }}
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </label>
          </div>

          <h1 className="text-xl font-bold italic text-green-800 mt-1">{user.name}</h1>
        </div>

        <nav className="flex flex-col mt-4 px-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActivePage(item.key as any)}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition
              ${activePage === item.key ? "bg-green-50 text-green-800" : "text-gray-700 hover:bg-green-50"}`}
            >
              {item.icon}
              {item.name}
            </button>
          ))}

          <div className="mt-6 px-3">
            <LogoutButton />
          </div>
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col md:ml-64">
        <header className="fixed top-0 left-64 right-0 h-16 px-6 bg-white shadow flex items-center justify-between z-40">
          <button className="md:hidden p-2" onClick={() => setSidebarOpen(!sidebarOpen)}>
            ☰
          </button>
          <p className="italic text-gray-700">Welcome, {user.name}</p>
        </header>

        <main className="flex-1 p-6 pt-20 overflow-y-auto">{renderPage()}</main>
      </div>
    </div>
  );
}
