'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Menu, X, ScanSearch, Boxes, Smartphone } from 'lucide-react';

const NAV = [
  { label: 'Home', href: '/' },
  { label: 'Projects', href: '/dashboard' },
  { label: '3D Editor', href: '/project/demo' },
  { label: 'Upload', href: '/upload' },
];

export default function HomePage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="font-geist">
      {/* ===== HERO ===== */}
      <section className="relative h-screen w-full overflow-hidden bg-black">
        {/* Background video */}
        <video
          autoPlay muted loop playsInline
          className="absolute h-full w-full object-cover"
          style={{ objectPosition: '70% center' }}
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_204221_5339e40b-e73d-4ab0-9c65-79c18c66fd50.mp4"
            type="video/mp4"
          />
        </video>
        {/* readability gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70" />

        {/* Navbar */}
        <nav className="relative z-30 flex items-center justify-between px-6 py-5 md:px-12 lg:px-16">
          <div className="flex items-center gap-8">
            <span className="text-lg font-semibold tracking-tight text-white sm:text-xl">Design<span className="text-[#7cc4ff]">AI</span></span>
            <div className="hidden items-center gap-7 md:flex">
              {NAV.map((n) => (
                <Link key={n.label} href={n.href} className="text-sm text-white/80 transition-colors hover:text-white">{n.label}</Link>
              ))}
            </div>
          </div>
          <Link href="/upload" className="hidden rounded-lg bg-white px-5 py-2 text-sm font-medium text-black transition-transform hover:scale-105 md:inline-block">Start designing</Link>

          {/* mobile toggle */}
          <button onClick={() => setOpen((v) => !v)} className="relative z-50 grid h-10 w-10 place-items-center active:scale-90 md:hidden" aria-label="Menu">
            <Menu size={24} className={`absolute text-white transition-all duration-300 ${open ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`} />
            <X size={24} className={`absolute text-white transition-all duration-300 ${open ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`} />
          </button>
        </nav>

        {/* Mobile menu */}
        <div className={`absolute inset-x-0 top-0 z-20 overflow-hidden bg-black/95 backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? 'h-screen opacity-100' : 'pointer-events-none h-0 opacity-0'}`}>
          <div className={`flex h-full flex-col justify-center gap-6 px-8 transition-all delay-100 duration-500 ${open ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            {NAV.map((n) => (
              <Link key={n.label} href={n.href} onClick={() => setOpen(false)} className="text-3xl font-medium text-white/90 hover:text-white">{n.label}</Link>
            ))}
            <Link href="/upload" onClick={() => setOpen(false)} className="mt-4 w-fit rounded-full bg-white px-8 py-3.5 text-base font-medium text-black hover:scale-105">Start designing</Link>
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 flex h-[calc(100vh-80px)] flex-col justify-between px-6 pb-10 pt-12 sm:pb-12 sm:pt-16 md:px-12 md:pb-16 md:pt-20 lg:px-16">
          <div className="max-w-3xl">
            <p className="mb-4 text-xs text-white/90 sm:mb-6 sm:text-sm animate-[fadeSlideUp_0.8s_ease_0.2s_both]">AI Interior Digital Twin</p>
            <h1 className="text-3xl font-medium leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl animate-[fadeSlideUp_0.8s_ease_0.4s_both]">
              Shape your space,<br />redesign with AI,<br />one room at a time.
            </h1>
          </div>
          <div>
            <p className="mb-5 max-w-sm text-sm leading-relaxed text-white/60 sm:mb-6 sm:max-w-lg sm:text-base md:text-lg animate-[fadeSlideUp_0.8s_ease_0.7s_both]">
              Upload a room photo. Our AI reads the space, recommends designs, and lets you place real furniture in an interactive 3D editor.
            </p>
            <div className="flex flex-wrap gap-3 animate-[fadeSlideUp_0.8s_ease_0.9s_both]">
              <Link href="/upload" className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black transition-transform hover:scale-105 sm:px-6 sm:py-3">
                Upload a room <ArrowRight size={16} />
              </Link>
              <Link href="/project/demo" className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10 sm:px-6 sm:py-3">
                Open 3D editor
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="bg-[rgb(var(--bg))] py-20">
        <div className="container-app">
          <p className="eyebrow mb-3">What it does</p>
          <h2 className="mb-12 max-w-2xl text-3xl font-semibold tracking-tight text-[rgb(var(--ink))] md:text-4xl">An end-to-end pipeline from photo to purchasable design</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-7">
                <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-[rgb(var(--accent-soft))] text-[rgb(var(--accent-600))]">
                  <f.icon size={22} />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--muted))]">{f.body}</p>
                <Link href={f.href} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[rgb(var(--accent-600))] hover:gap-2 transition-all">{f.cta} <ArrowRight size={14} /></Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="bg-[rgb(var(--bg))] pb-24">
        <div className="container-app">
          <div className="card flex flex-col items-center gap-5 bg-gradient-to-br from-[rgb(var(--accent-600))] to-[rgb(var(--accent))] p-12 text-center text-black">
            <h2 className="max-w-xl text-3xl font-semibold tracking-tight">Ready to redesign your room?</h2>
            <p className="max-w-md text-black/75">Upload a photo for real AI recommendations, or jump straight into the 3D editor.</p>
            <div className="flex gap-3">
              <Link href="/upload" className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-black/85">Upload a room</Link>
              <Link href="/project/demo" className="rounded-full border border-black/30 px-6 py-3 text-sm font-semibold text-black hover:bg-black/10">Open 3D editor</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

const FEATURES = [
  { icon: ScanSearch, title: 'AI Room Analysis', body: 'Multimodal Bedrock (Claude) analysis turns a single room photo into a structured understanding — dimensions, style, lighting, palette, and 3 design directions.', cta: 'Upload a room', href: '/upload' },
  { icon: Boxes, title: '3D Room Editor', body: 'A real-time Three.js editor — place, scale, rotate and recolor furniture from a live catalog, with 2D/3D views and selectable, modeled pieces.', cta: 'Open the editor', href: '/project/demo' },
  { icon: Smartphone, title: 'AR Preview', body: 'Point your phone at the floor and preview furniture at true real-world scale in your actual room.', cta: 'Try it', href: '/project/demo' },
];
