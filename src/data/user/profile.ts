import getDb from "@/lib/mongodb";

interface Profile {
  name: string;
  email: string;
  phone: string;
}

interface ProfileFallback {
  name?: string;
  phone?: string;
}

export async function getProfile(
  email: string,
  fallback: ProfileFallback = {},
): Promise<Profile> {
  const db = await getDb();
  const users = db.collection("users");
  const user = await users.findOne({ email });
  return {
    name: user?.name || fallback.name || "",
    email,
    phone: user?.phone || fallback.phone || "",
  };
}

interface UpdateProfileParams {
  name?: string;
  phone?: string;
}

export async function updateProfile(
  email: string,
  { name = "", phone = "" }: UpdateProfileParams,
): Promise<{ ok: boolean }> {
  const db = await getDb();
  const users = db.collection("users");
  const before = await users.findOne({ email });
  const nextName = String(name || "");
  const nextPhone = String(phone || "");
  const changed =
    (before?.name || "") !== nextName || (before?.phone || "") !== nextPhone;
  if (changed) {
    try {
      await db.collection("profileAudits").insertOne({
        email,
        before: { name: before?.name || "", phone: before?.phone || "" },
        after: { name: nextName, phone: nextPhone },
        updatedBy: email,
        updatedAt: new Date(),
      });
    } catch {
      /* best effort */
    }
  }
  await users.updateOne(
    { email },
    { $set: { name: nextName, phone: nextPhone, updatedAt: new Date() } },
    { upsert: true },
  );
  return { ok: true };
}
