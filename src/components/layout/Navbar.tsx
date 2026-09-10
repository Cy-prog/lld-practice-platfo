"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Code2, BookOpen, History, LayoutDashboard, Sparkles } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/problems", label: "Problems", icon: BookOpen },
    { href: "/attempts", label: "Attempt History", icon: History },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-white flex items-center gap-1.5">
                LLD<span className="text-blue-400">Craft</span>
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono block -mt-1">
                Domain Practice Studio
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-slate-800 text-blue-400 shadow-sm border border-slate-700/50"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Rubric-Based Evaluation</span>
          </div>

          <Link
            href="/problems"
            className="text-xs sm:text-sm px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all shadow-sm shadow-blue-500/10"
          >
            Start Practice
          </Link>
        </div>
      </div>
    </header>
  );
}
