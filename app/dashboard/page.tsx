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

// Import components (unchanged)
import TextNotes from "./components/TextNotes";
import ImageNotes from "./components/ImageNotes";

type User = { email: string; name: string };

export default function DashboardSPA() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState<
    "dashboard" | "text-notes" | "image-notes" | "file-notes" | "profile" | "settings"
  >("dashboard");

  const fetchUser = async () => {
    try {
      let res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.status === 401) {
        const refreshRes = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        });
        if (refreshRes.ok)
          res = await fetch("/api/auth/me", { credentials: "include" });
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
    { name: "Profile", icon: <HiUser size={20} />, key: "profile" },
    { name: "Settings", icon: <HiCog size={20} />, key: "settings" },
  ];

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return (
          <>
            <h2 className="text-2xl font-bold text-green-800 mb-4">
              Dashboard
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-black">Email</p>
                <p className="text-lg font-semibold text-black">
                  {user.email}
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-black">Name</p>
                <p className="text-lg font-semibold text-black">
                  {user.name}
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-black">Last Login</p>
                <p className="text-lg font-semibold text-black">Today</p>
              </div>
            </div>

            <p className="mt-6 text-gray-600">
              Select a note type from the sidebar.
            </p>
          </>
        );

      case "text-notes":
        return <TextNotes />;

      case "image-notes":
        return <ImageNotes />; // ✅ FIX — component now renders

      case "file-notes":
        return (
          <div className="p-6 text-gray-700">
            File Notes Page (SPA content here)
          </div>
        );

      case "profile":
        return <div className="p-6">Profile Page</div>;

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
        md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative`}
      >
        <div className="flex items-center justify-center h-16 border-b">
          <h1 className="text-xl font-bold text-green-800">NikNotes</h1>
        </div>

        <nav className="flex flex-col mt-4 px-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActivePage(item.key as any)}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition
              ${
                activePage === item.key
                  ? "bg-green-50 text-green-800"
                  : "text-gray-700 hover:bg-green-50"
              }`}
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
          <button
            className="md:hidden p-2"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
          <p className="italic text-gray-700">Welcome, {user.name}</p>
        </header>

        <main className="flex-1 p-6 pt-20 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
