'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="container-app pt-16 pb-12 md:pt-24">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <p className="eyebrow mb-4">AI Interior Digital Twin</p>
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight md:text-6xl">
              Design your space,<br />
              <span className="text-[rgb(var(--accent))]">visualized in 3D.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-[rgb(var(--muted))]">
              Upload a room photo. Our AI reads the space, recommends designs, and lets you
              place real furniture in an interactive 3D editor — then preview it in AR.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/upload" className="btn-primary">Start designing — it's free</Link>
              <Link href="/project/demo" className="btn-ghost">Try the 3D editor</Link>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-[rgb(var(--muted))]">
              <span className="flex items-center gap-2"><Dot /> Bedrock-powered analysis</span>
              <span className="flex items-center gap-2"><Dot /> Real 3D furniture</span>
              <span className="flex items-center gap-2"><Dot /> AR preview</span>
            </div>
          </div>

          {/* Editor mock card */}
          <div className="card overflow-hidden">
            <div className="flex items-center gap-2 border-b border-[rgb(var(--line))] px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-red-400" />
              <span className="h-3 w-3 rounded-full bg-amber-400" />
              <span className="h-3 w-3 rounded-full bg-green-400" />
              <span className="ml-3 text-sm font-medium text-[rgb(var(--muted))]">Living Room · Ground floor</span>
            </div>
            <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-50 to-slate-100">
              <div className="absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-2xl bg-white shadow-lg">
                    <span className="text-3xl">🛋️</span>
                  </div>
                  <p className="text-sm text-[rgb(var(--muted))]">Interactive 3D room preview</p>
                </div>
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 seg">
                <span className="seg-item">2D</span>
                <span className="seg-item seg-item-active">3D</span>
                <span className="seg-item">AR</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-[rgb(var(--line))] bg-white py-16">
        <div className="container-app">
          <p className="eyebrow mb-3">How it works</p>
          <h2 className="mb-10 text-3xl font-semibold tracking-tight">From photo to purchasable design in minutes</h2>
          <div className="grid gap-6 md:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s.title} className="card p-6">
                <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-[rgb(var(--accent-soft))] text-sm font-bold text-[rgb(var(--accent-600))]">{i + 1}</div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--muted))]">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16">
        <div className="container-app">
          <div className="grid gap-6 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-7">
                <div className="mb-4 text-3xl">{f.icon}</div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--muted))]">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-app pb-24">
        <div className="card flex flex-col items-center gap-5 bg-gradient-to-br from-[rgb(var(--accent))] to-[rgb(var(--accent-600))] p-12 text-center text-white">
          <h2 className="max-w-xl text-3xl font-semibold tracking-tight">Ready to redesign your room?</h2>
          <p className="max-w-md text-white/85">Start with a photo or jump straight into the 3D editor.</p>
          <div className="flex gap-3">
            <Link href="/upload" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[rgb(var(--accent-600))] transition hover:bg-white/90">Upload a room</Link>
            <Link href="/project/demo" className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">Open 3D editor</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Dot() {
  return <span className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--accent))]" />;
}

const STEPS = [
  { title: 'Upload your room', body: 'Drop a photo of any room. Optionally add an inspiration image.' },
  { title: 'AI understands it', body: 'Bedrock reads dimensions, style, lighting, and existing furniture.' },
  { title: 'Get 3 designs', body: 'Personalized themes with palettes, materials, and real products.' },
  { title: 'Edit in 3D & AR', body: 'Drag, rotate, recolor furniture — then preview it in your room.' },
];

const FEATURES = [
  { icon: '🏠', title: 'AI Room Analysis', body: 'Multimodal Bedrock analysis turns a single photo into a structured understanding of your space.' },
  { icon: '🪑', title: '3D Room Editor', body: 'A real-time Three.js editor — place, scale, rotate, and recolor furniture with collision-aware snapping.' },
  { icon: '📱', title: 'AR Preview', body: 'Point your phone at the floor and see furniture appear at true real-world scale in your room.' },
];
