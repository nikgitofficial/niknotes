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

type ActivePage =
  | "dashboard"
  | "text-notes"
  | "image-notes"
  | "file-notes"
  | "video-notes"
  | "profile"
  | "settings";

export default function DashboardSPA() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState<ActivePage>("dashboard");

  // Fetch user info
  const fetchUser = async () => {
    try {
      let res = await fetch("/api/auth/me", { credentials: "include" });

      if (res.status === 401) {
        const refreshRes = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        });

        if (refreshRes.ok) {
          res = await fetch("/api/auth/me", { credentials: "include" });
        } else {
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

  const navItems: { name: string; icon: JSX.Element; key: ActivePage }[] = [
    { name: "Home", icon: <HiHome size={20} />, key: "dashboard" },
    { name: "Text Notes", icon: <HiOutlineDocumentText size={20} />, key: "text-notes" },
    { name: "Image Notes", icon: <HiOutlinePhotograph size={20} />, key: "image-notes" },
    { name: "File Notes", icon: <HiOutlinePaperClip size={20} />, key: "file-notes" },
    { name: "Video Notes", icon: <HiOutlinePhotograph size={20} />, key: "video-notes" },
    { name: "Profile", icon: <HiUser size={20} />, key: "profile" },
    { name: "Settings", icon: <HiCog size={20} />, key: "settings" },
  ];

  // Upload profile photo
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
        setUser((prev) =>
          prev ? { ...prev, photoUrl: `${data.photo}?t=${Date.now()}` } : prev
        );
      } else {
        alert(data.error || "Failed to upload profile picture");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload profile picture");
    }
  };

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
            <img
              src={user.photoUrl || "https://via.placeholder.com/150"}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-2 border-green-700"
            />
          </div>
        );
      case "settings":
        return <div className="p-6">Settings Page</div>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg md:relative">
        <nav className="flex flex-col mt-4 px-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActivePage(item.key)}
              className={`flex items-center gap-3 px-3 py-2 rounded-md
                ${activePage === item.key ? "bg-green-50 text-green-800" : "text-gray-700 hover:bg-green-50"}`}
            >
              {item.icon}
              {item.name}
            </button>
          ))}
          <LogoutButton />
        </nav>
      </aside>

      <main className="flex-1 p-6 overflow-y-auto">{renderPage()}</main>
    </div>
  );
}
