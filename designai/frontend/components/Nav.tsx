'use client';

import Link from 'next/link';

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-[rgb(var(--line))] bg-[rgb(var(--bg))]/80 backdrop-blur">
      <div className="container-app flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[rgb(var(--accent))] text-sm font-bold text-white">D</span>
          <span className="text-lg font-semibold tracking-tight">
            Design<span className="text-[rgb(var(--accent))]">AI</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <a href="/#how" className="text-sm text-[rgb(var(--muted))] transition-colors hover:text-[rgb(var(--ink))]">How it works</a>
          <a href="/#features" className="text-sm text-[rgb(var(--muted))] transition-colors hover:text-[rgb(var(--ink))]">Features</a>
          <Link href="/dashboard" className="text-sm text-[rgb(var(--muted))] transition-colors hover:text-[rgb(var(--ink))]">Projects</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/project/demo" className="hidden text-sm font-medium text-[rgb(var(--ink))] transition-colors hover:text-[rgb(var(--accent))] sm:inline">
            Open 3D editor
          </Link>
          <Link href="/upload" className="btn-primary !px-5 !py-2.5">Start designing</Link>
        </div>
      </div>
    </header>
  );
}
