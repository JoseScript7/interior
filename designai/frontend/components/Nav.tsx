'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';

/**
 * Global nav for the inner (light) app pages. The landing page ('/') and the
 * full-screen editor render their own chrome, so we hide this there.
 */
export function Nav() {
  const pathname = usePathname();
  if (pathname === '/' || pathname.startsWith('/project')) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-[rgb(var(--line))] bg-[rgb(var(--bg))]/80 backdrop-blur">
      <div className="container-app flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[rgb(var(--accent))] text-sm font-bold text-white">D</span>
          <span className="text-lg font-semibold tracking-tight">Design<span className="text-[rgb(var(--accent))]">AI</span></span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/" className="text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--ink))]">Home</Link>
          <Link href="/dashboard" className="text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--ink))]">Projects</Link>
          <Link href="/project/demo" className="text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--ink))]">3D Editor</Link>
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/upload" className="btn-primary !px-5 !py-2.5">Start designing</Link>
        </div>
      </div>
    </header>
  );
}
