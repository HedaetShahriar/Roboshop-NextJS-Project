import { NextRequest, NextResponse } from "next/server";
import {
  getAuthedSession,
  forbidden,
  badRequest,
  notFound,
  ok,
} from "@/lib/api";
import { ObjectId } from "mongodb";
import getDb from "@/lib/mongodb";

interface PatchBody {
  message?: string;
  status?: "open" | "in_progress" | "resolved";
}

interface OrderIssueDocument {
  _id: ObjectId;
  orderId: ObjectId;
  userId: string;
  status: string;
  messages: Array<{ by: string; text: string; at: Date }>;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { error, session } = await getAuthedSession();
  if (error) return error;
  const { id } = await params;
  const db = await getDb();
  let issue: OrderIssueDocument | null;
  try {
    issue = await db
      .collection<OrderIssueDocument>("order_issues")
      .findOne({ _id: new ObjectId(id) });
  } catch {
    return badRequest("Invalid issue id");
  }
  if (!issue) return notFound();

  const body: PatchBody = await request.json();
  const now = new Date();
  const updates: Record<string, unknown> = { updatedAt: now };
  const push: Record<string, unknown> = {};

  // Customers can only add messages to their own issue
  const role = session!.user.role || "customer";
  const isOwner = issue.userId === session!.user.email;

  if (body?.message) {
    const text = (body.message || "").toString().slice(0, 4000);
    if (text) {
      push.messages = {
        by: role === "customer" && isOwner ? "customer" : "seller",
        text,
        at: now,
      };
    }
  }

  if (body?.status) {
    if (role === "customer") return forbidden();
    const next = body.status;
    if (!["open", "in_progress", "resolved"].includes(next)) {
      return badRequest("Invalid status");
    }
    updates.status = next;
  }

  const updateDoc: Record<string, unknown> = { $set: updates };
  if (push.messages) updateDoc.$push = { messages: push.messages };

  await db
    .collection("order_issues")
    .updateOne({ _id: issue._id }, updateDoc as any);

  // If resolved, append to order history
  if (updates.status === "resolved") {
    try {
      await db.collection("orders").updateOne(
        { _id: issue.orderId },
        {
          $push: {
            history: { code: "issue-resolved", label: "Issue resolved", at: now },
          } as any,
          $set: { updatedAt: now },
        }
      );
    } catch {}
  }

  return ok({ ok: true });
}
