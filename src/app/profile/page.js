import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import ProfileClient from "./profile-client";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return (
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-4">My Profile</h1>
        <p>Please login to view your profile.</p>
      </div>
    );
  }

  const client = await clientPromise;
  const db = client.db("roboshop");
  const users = db.collection("users");
  const user = await users.findOne({ email: session.user.email });
  const profile = {
    name: user?.name || session.user.name || "",
    email: session.user.email,
    phone: user?.phone || "",
    image: user?.image || session.user.image || "",
  };

  const addresses = await db
    .collection("addresses")
    .find({ userId: session.user.email })
    .sort({ createdAt: -1 })
    .toArray();
  const addr = addresses.map((a) => ({ ...a, _id: a._id.toString() }));

  return <ProfileClient initialProfile={profile} initialAddresses={addr} />;
}
