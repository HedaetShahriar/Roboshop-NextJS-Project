import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function RiderDashboard() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || 'customer';
  if (!session?.user?.email || role !== 'rider') return notFound();
  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">Rider Overview</h2>
      <p className="text-gray-600 text-sm">Assigned orders and tasks will appear here.</p>
    </div>
  );
}
