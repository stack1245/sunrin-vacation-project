import Link from "next/link";

const navigation = [
  { href: "/stages", label: "STAGES" },
  { href: "/leaderboard", label: "LEADERBOARD" },
];

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#07090d]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          className="group flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          aria-label="OutOfBounds 홈"
        >
          <span className="grid size-8 place-items-center border border-cyan-300/40 bg-cyan-300/5 font-mono text-[10px] font-bold tracking-tighter text-cyan-200 transition group-hover:bg-cyan-300/10">
            OOB
          </span>
          <span className="text-sm font-black tracking-[0.18em] text-white">
            OUT<span className="text-cyan-300">OF</span>BOUNDS
          </span>
        </Link>

        <nav aria-label="주요 메뉴">
          <ul className="flex items-center gap-5 sm:gap-8">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-[11px] font-semibold tracking-[0.16em] text-zinc-400 transition hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
