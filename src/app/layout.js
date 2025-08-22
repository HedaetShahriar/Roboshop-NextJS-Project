import { Inter } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Providers from "./providers";
import Navbar from "@/components/Navbar & Footer/Navbar";
import Footer from "@/components/Navbar & Footer/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Roboshop",
  description: "Your one-stop shop for robotics parts!",
};

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers session={session}>
          <Navbar />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>

  );
}