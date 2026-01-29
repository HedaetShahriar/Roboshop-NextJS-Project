import { Inter } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Providers from "./providers";
import Navbar from "@/components/Navbar & Footer/Navbar";
import Footer from "@/components/Navbar & Footer/Footer";
import { Toaster } from "@/components/ui/sonner";
import { getPlatformSettings } from "@/lib/settings";
import { getReadableTextColor } from "@/lib/colors";
import type { Metadata } from "next";
import type { ReactNode } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Roboshop",
  description: "Your one-stop shop for robotics parts!",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const session = await getServerSession(authOptions);
  let settings = null;
  try {
    settings = await getPlatformSettings();
  } catch {
    /* ignore */
  }
  const themeVars: Record<string, string> = settings?.theme
    ? {
        "--primary": settings.theme.primaryColor || "",
        "--accent": settings.theme.accentColor || "",
        "--primary-foreground": getReadableTextColor(
          settings.theme.primaryColor,
        ),
        "--accent-foreground": getReadableTextColor(settings.theme.accentColor),
        "--radius":
          settings.theme.borderRadius === "sm"
            ? "0.5rem"
            : settings.theme.borderRadius === "lg"
              ? "0.75rem"
              : settings.theme.borderRadius === "xl"
                ? "1rem"
                : "0.625rem",
      }
    : {};
  return (
    <html lang="en">
      <body
        className={`${inter.className} min-h-dvh grid grid-rows-[auto_1fr_auto]`}
        style={themeVars as React.CSSProperties}
      >
        <Providers session={session}>
          <Toaster />
          <Navbar />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
