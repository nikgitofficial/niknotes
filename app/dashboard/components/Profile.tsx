"use client";

type User = {
  name: string;
  email: string;
  photoUrl?: string;
};

export default function Profile({
  user,
  onPhotoUpload,
}: {
  user: User;
  onPhotoUpload: (file: File) => void;
}) {
  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow">
      <h2 className="text-2xl font-bold text-green-800 mb-6 text-center">
        Profile
      </h2>

      {/* Profile picture */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <img
            src={user.photoUrl || "https://via.placeholder.com/150"}
            alt="Profile"
            className="w-28 h-28 rounded-full object-cover border-2 border-green-700"
          />

          <label className="absolute bottom-0 right-0 bg-green-700 p-2 rounded-full cursor-pointer hover:bg-green-800">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onPhotoUpload(file);
              }}
            />
            <span className="text-white text-xs">✎</span>
          </label>
        </div>

        {/* User info */}
        <div className="text-center">
          <p className="text-lg font-semibold text-black">{user.name}</p>
          <p className="text-gray-600">{user.email}</p>
        </div>
      </div>
    </div>
  );
}
