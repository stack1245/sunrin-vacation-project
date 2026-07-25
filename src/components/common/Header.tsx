import Link from "next/link";

import { Navbar } from "./Navbar";

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/8 bg-[#071310]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          className="group flex items-center gap-3"
          aria-label="The Escape 홈"
        >
          <span className="grid size-8 place-items-center rounded-full border border-amber-300/35 bg-amber-300/8 text-sm text-amber-200 transition-transform group-hover:rotate-12">
            E
          </span>
          <span className="font-serif text-lg tracking-[0.16em] text-slate-100">
            THE ESCAPE
          </span>
        </Link>
        <Navbar />
      </div>
    </header>
  );
}
