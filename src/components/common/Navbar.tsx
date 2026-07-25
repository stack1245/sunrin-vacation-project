"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/stages", label: "스테이지" },
  { href: "/leaderboard", label: "리더보드" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav aria-label="주요 메뉴" className="flex items-center gap-1">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-full px-3 py-2 text-sm transition-colors ${
              isActive
                ? "bg-white/10 text-amber-200"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
