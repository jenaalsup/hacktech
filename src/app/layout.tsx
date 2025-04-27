// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProfileGuard from "@/components/ProfileGuard";
import { AuthProvider } from "@/lib/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cumble",
  description: "Summer roommate finder for college students",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      {/* 
        Change here: use min-h-screen instead of h-full on the body,
        so that flex will always stretch to at least the viewport height
      */}
      <body className="flex flex-col min-h-screen antialiased">
        <AuthProvider>
          <Navbar />
          <ProfileGuard>
            {/* main flex-grows to push the Footer down */}
            <main className="flex-grow">{children}</main>
          </ProfileGuard>
        </AuthProvider>
        <Footer />
      </body>
    </html>
  );
}
