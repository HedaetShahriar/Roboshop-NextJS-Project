import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = 'force-dynamic';

export default async function SellerDashboardHome() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || 'customer';
  if (!session?.user?.email || role === 'customer') return notFound();
  if (role === 'seller') return redirect('/dashboard/seller');
  if (role === 'rider') return redirect('/dashboard/rider');
  if (role === 'admin') return redirect('/dashboard/admin');
  
}
