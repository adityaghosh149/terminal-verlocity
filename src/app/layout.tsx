import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "Terminal Velocity | Probability-Based Arcade Typing Game",
  description:
    "Type fast. Think faster. A high-stakes arcade typing game combining rapid keyboard execution with mathematical risk management and probability analytics.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="midnight">
      <body className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased selection:bg-primary selection:text-primary-foreground terminal-grid">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
