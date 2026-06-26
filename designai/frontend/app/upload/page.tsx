'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';
const ROOM_TYPES = ['Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Office', 'Dining Room'];

export default function UploadPage() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [backendOffline, setBackendOffline] = useState(false);
  const [roomType, setRoomType] = useState<string | null>(null);

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please upload a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10MB.');
      return;
    }
    setError(null);
    setBackendOffline(false);
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    setProgress(15);

    try {
      // Path C: send the photo straight to the Bedrock-backed /local/analyze.
      const form = new FormData();
      form.append('image', file);
      if (roomType) form.append('roomType', roomType);
      setProgress(40);

      const res = await fetch(`${API_BASE}/local/analyze`, { method: 'POST', body: form });
      if (!res.ok) throw new Error(`analyze ${res.status}`);
      setProgress(90);
      const data = await res.json();
      setProgress(100);
      setTimeout(() => router.push(`/project/${data.projectId}`), 600);
    } catch (err) {
      setBackendOffline(true);
      setUploading(false);
      setProgress(0);
    }
  }, [router, roomType]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div className="container-app py-14">
      <div className="mx-auto max-w-2xl">
        <p className="eyebrow mb-3">Step 1 · Upload</p>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Upload your room</h1>
        <p className="mt-3 text-[rgb(var(--muted))]">
          Take a photo of any room. Our AI analyzes the space, recommends designs, and lets you
          visualize furniture in 3D.
        </p>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`mt-8 cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all
            ${isDragActive ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent-soft))]' : 'border-[rgb(var(--line))] bg-[rgb(var(--surface))] hover:border-[rgb(var(--accent))]'}
            ${uploading ? 'pointer-events-none opacity-60' : ''}`}
        >
          <input {...getInputProps()} />
          {preview ? (
            <img src={preview} alt="Room preview" className="mx-auto max-h-72 rounded-xl object-cover shadow" />
          ) : (
            <div>
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[rgb(var(--accent-soft))] text-2xl">📷</div>
              <p className="text-lg font-medium">{isDragActive ? 'Drop your photo here' : 'Drag & drop a room photo'}</p>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">or click to browse · JPG, PNG, WebP · max 10MB</p>
            </div>
          )}
        </div>

        {/* Progress */}
        {uploading && (
          <div className="mt-5">
            <div className="mb-1 flex justify-between text-sm text-[rgb(var(--muted))]">
              <span>Uploading…</span><span>{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-[rgb(var(--accent))] transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Validation error */}
        {error && <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        {/* Backend offline — graceful path */}
        {backendOffline && (
          <div className="mt-6 card p-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-xl">ℹ️</span>
              <div>
                <p className="font-semibold">AI backend isn't connected yet</p>
                <p className="mt-1 text-sm text-[rgb(var(--muted))]">
                  The cloud backend (room analysis, recommendations) isn't deployed in this environment.
                  You can still explore the full <strong>3D room editor</strong> with the demo scene.
                </p>
                <Link href="/project/demo" className="btn-primary mt-4">Open the 3D editor →</Link>
              </div>
            </div>
          </div>
        )}

        {/* Room type */}
        <div className="mt-10">
          <label className="mb-3 block text-sm font-medium">Room type <span className="text-[rgb(var(--muted))]">(optional)</span></label>
          <div className="flex flex-wrap gap-2">
            {ROOM_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setRoomType(roomType === t ? null : t)}
                className={`rounded-full border px-4 py-2 text-sm transition-colors
                  ${roomType === t ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent-soft))] text-[rgb(var(--accent))]' : 'border-[rgb(var(--line))] bg-[rgb(var(--surface))] text-[rgb(var(--ink))] hover:border-[rgb(var(--accent))]'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
