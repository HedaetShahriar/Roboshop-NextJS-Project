import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/mongodb";
import { ObjectId } from "mongodb";

interface CheckSlugResponse {
  ok: boolean;
  available?: boolean;
  message?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<CheckSlugResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const slug = (searchParams.get("slug") || "").toString().trim();
    const excludeId = (searchParams.get("excludeId") || "").toString().trim();

    if (!slug) {
      return NextResponse.json(
        { ok: false, message: "Missing slug" },
        { status: 400 }
      );
    }

    const db = await getDb();

    const query = excludeId
      ? { slug, _id: { $ne: new ObjectId(excludeId) } }
      : { slug };

    const existing = await db
      .collection("products")
      .findOne(query, { projection: { _id: 1 } });

    const available = !existing;

    return NextResponse.json({ ok: true, available }, { status: 200 });
  } catch (e) {
    console.error("Error checking slug availability:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
