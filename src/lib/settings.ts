import getDb from "./mongodb";
import type { PlatformSettings } from "@/types";

export async function getPlatformSettings(): Promise<PlatformSettings | null> {
  const db = await getDb();
  const doc = await db
    .collection("settings")
    .findOne({ _id: "platform" as unknown as import("mongodb").ObjectId });
  return (doc as PlatformSettings) || null;
}
