"use client";

type Props = {
  user: {
    email: string;
    name: string;
  };
};

export default function DashboardHome({ user }: Props) {
  return (
    <>
      <h2 className="text-2xl font-bold text-green-800 mb-6">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Email</p>
          <p className="text-lg font-semibold text-black">{user.email}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Name</p>
          <p className="text-lg font-semibold text-black">{user.name}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Last Login</p>
          <p className="text-lg font-semibold text-black">Today</p>
        </div>
      </div>
    </>
  );
}
