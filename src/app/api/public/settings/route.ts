import { NextResponse } from "next/server";
import getDb from "@/lib/mongodb";

export const revalidate = 60; // cache for 1 minute

interface SettingsDocument {
  _id: string;
  siteName?: string;
  navigation?: {
    headerLinks?: Array<{ label: string; href: string }>;
    footerLinks?: Array<{ label: string; href: string }>;
  };
  branding?: {
    logoUrl?: string;
  };
  theme?: Record<string, unknown> | null;
}

interface SafeSettings {
  siteName: string;
  navigation: {
    headerLinks: Array<{ label: string; href: string }>;
    footerLinks: Array<{ label: string; href: string }>;
  };
  branding: {
    logoUrl: string;
  };
  theme: Record<string, unknown> | null;
}

export async function GET(): Promise<Response> {
  try {
    const db = await getDb();
    const doc = await db
      .collection<SettingsDocument>("settings")
      .findOne({ _id: "platform" });
    const safe: SafeSettings = {
      siteName: doc?.siteName || "Roboshop",
      navigation: {
        headerLinks: doc?.navigation?.headerLinks || [{ label: "Products", href: "/products" }],
        footerLinks: doc?.navigation?.footerLinks || [],
      },
      branding: { logoUrl: doc?.branding?.logoUrl || "" },
      theme: doc?.theme || null,
    };
    return new Response(JSON.stringify(safe), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ siteName: "Roboshop" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}
