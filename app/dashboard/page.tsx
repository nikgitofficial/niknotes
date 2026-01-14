import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import LogoutButton from "./LogoutButton";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) return <p>Unauthorized. Please login.</p>;

  const user = verifyToken(token);
  if (!user) return <p>Unauthorized. Please login.</p>;

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user.email}</p>
      <LogoutButton />
    </div>
  );
}
