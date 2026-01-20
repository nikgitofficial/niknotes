"use client";

type Props = {
  user: {
    email: string;
    name: string;
  };
};

export default function SettingsPage({ user }: Props) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-black mb-6">Settings</h2>

      <div className="bg-white p-6 rounded-lg shadow space-y-6">
        {/* Account Info */}
        <div>
          <p className="text-sm text-black font-semibold">Account Information</p>
          <p className="text-black">Name: {user.name}</p>
          <p className="text-black">Email: {user.email}</p>
        </div>

        {/* Password */}
        <div>
          <p className="text-sm text-black font-semibold">Password</p>
          <p className="text-black">Change your account password here.</p>
        </div>

        {/* Notifications */}
        <div>
          <p className="text-sm text-black font-semibold">Notifications</p>
          <p className="text-black">Manage your email and app notification preferences.</p>
        </div>

        {/* Privacy */}
        <div>
          <p className="text-sm text-black font-semibold">Privacy</p>
          <p className="text-black">Control what information is visible to others.</p>
        </div>
      </div>
    </div>
  );
}
