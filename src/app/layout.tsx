import type { Metadata } from "next";
import "./globals.css";

import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Familie Dula",
  description: "Die Familien-App fuer die Familie Dula",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased min-h-screen bg-background">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
