import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "LLDCraft — Low-Level Design Practice & Evidence-Based Feedback",
  description:
    "Master Low-Level Design with guided practice, deterministic architectural validation, and explainable rubric-based AI evaluation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500 font-mono">
          LLDCraft Practice Studio • Practice repeatedly, inspect evidence, master domain design
        </footer>
      </body>
    </html>
  );
}
