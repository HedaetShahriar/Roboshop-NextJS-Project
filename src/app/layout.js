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

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Roboshop",
  description: "Your one-stop shop for robotics parts!",
};

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions);
  let settings = null;
  try {
    settings = await getPlatformSettings();
  } catch {}
  const themeVars = settings?.theme ? {
    '--primary': settings.theme.primaryColor,
    '--accent': settings.theme.accentColor,
    '--primary-foreground': getReadableTextColor(settings.theme.primaryColor),
    '--accent-foreground': getReadableTextColor(settings.theme.accentColor),
  } : {};
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-dvh grid grid-rows-[auto_1fr_auto]`} style={themeVars}>
        <Providers session={session}>
          <Toaster />
          <Navbar />
          <main>
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>

  );
}