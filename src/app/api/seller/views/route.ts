import { NextRequest, NextResponse } from "next/server";
import { getAuthedSession, ok, badRequest } from "@/lib/api";
import getDb from "@/lib/mongodb";
import type { Document, WithId } from "mongodb";

interface SavedView {
  userEmail: string;
  type: string;
  name: string;
  qs: string;
  createdAt: Date;
}

interface SavedViewDocument extends WithId<Document>, SavedView {}

interface ViewsResponse {
  items: SavedViewDocument[];
}

interface CreateViewBody {
  name?: string;
  qs?: string;
}

interface CreateViewResponse {
  item: SavedView;
}

export async function GET(): Promise<NextResponse<ViewsResponse | { error: string }>> {
  const { error, session } = await getAuthedSession({ requireSeller: true });
  if (error) return error;

  const db = await getDb();
  const items = (await db
    .collection("saved_views")
    .find({ userEmail: session!.user.email, type: "products" })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray()) as SavedViewDocument[];

  return ok({ items });
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<CreateViewResponse | { error: string }>> {
  const { error, session } = await getAuthedSession({ requireSeller: true });
  if (error) return error;

  const db = await getDb();
  const body: CreateViewBody = await request.json().catch(() => ({}));
  const name = (body?.name || "").toString().trim();
  const qs = (body?.qs || "").toString();

  if (!name) {
    return badRequest("Name is required");
  }

  const doc: SavedView = {
    userEmail: session!.user.email!,
    type: "products",
    name,
    qs,
    createdAt: new Date(),
  };

  await db.collection("saved_views").insertOne(doc);

  return ok({ item: doc });
}
