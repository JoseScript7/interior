'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ProjectSummary {
  projectId: string;
  title?: string;
  status: string;
  roomType?: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/project/`)
      .then((res) => res.json())
      .then((data) => setProjects(data.projects || []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container-app py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="eyebrow mb-2">Your workspace</p>
          <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">Your room designs and AI recommendations</p>
        </div>
        <Link href="/upload" className="btn-primary">+ New project</Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-white/70" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-[rgb(var(--accent-soft))] text-3xl">🏠</div>
          <p className="text-[rgb(var(--muted))]">No projects yet. Upload a room photo to get started.</p>
          <Link href="/upload" className="btn-primary mt-5">Upload your first room</Link>
          <Link href="/project/demo" className="mt-3 text-sm font-medium text-[rgb(var(--accent-600))] hover:underline">or try the 3D editor demo →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <Link
              key={project.projectId}
              href={`/project/${project.projectId}`}
              className="card p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{project.title || project.roomType || 'Untitled Room'}</h3>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">{new Date(project.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  project.status === 'completed' ? 'bg-green-100 text-green-700' :
                  project.status === 'editing' ? 'bg-[rgb(var(--accent-soft))] text-[rgb(var(--accent-600))]' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {project.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
