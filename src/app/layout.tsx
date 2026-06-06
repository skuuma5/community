import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Retrolink - The 2010 Social Forum Network",
  description: "What if X/Twitter had been created in 2010 as a classic, community-focused internet forum? Welcome to Retrolink.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col bg-[#d1e1f0] dark:bg-[#151d26]">
        <Providers>
          <Navbar />
          <main className="flex-1 max-w-[1100px] w-full mx-auto p-3 flex flex-col">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
