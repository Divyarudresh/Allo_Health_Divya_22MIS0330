import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-teal-100/80 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-lg font-bold text-white shadow-md shadow-teal-500/25 transition group-hover:shadow-lg group-hover:shadow-teal-500/30">
            A
          </span>
          <div>
            <p className="text-lg font-semibold tracking-tight text-slate-900">
              Allo Health
            </p>
            <p className="text-xs text-slate-500">
              Inventory & Reservations · Developed by Divya R
            </p>
          </div>
        </Link>
        <nav className="hidden sm:flex items-center gap-6 text-sm text-slate-600">
          <span className="rounded-full bg-teal-50 px-3 py-1 text-teal-700 font-medium">
            Live stock
          </span>
        </nav>
      </div>
    </header>
  );
}
