import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Image from "next/image";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "logix.lol",
  description: "logix's website :3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} relative min-h-screen antialiased`}
      >
        <Image
          className="fixed inset-0 -z-50 object-cover brightness-25"
          src={"/kharkiv.png"}
          fill
          sizes="100vw"
          priority
          unoptimized
          alt="Background image of Kharkiv, Ukraine"
        />
        {children}
      </body>
    </html>
  );
}
