'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useSceneStore, TasteProfile } from '@/store/scene-store';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Props {
  projectId: string;
}

interface UploadedImage {
  dataBase64: string;
  format: string;
  previewUrl: string;
}

/**
 * Inspiration intake — replaces the old static 3-card recommendations.
 * Users add Pinterest links, upload images, and/or describe their taste.
 * Qwen3-VL turns it into a taste profile that drives the floor-plan layout.
 */
export function InspirationPanel({ projectId }: Props) {
  const tasteProfile = useSceneStore((s) => s.tasteProfile);
  const setTasteProfile = useSceneStore((s) => s.setTasteProfile);

  const [pinterestUrl, setPinterestUrl] = useState('');
  const [pinterestUrls, setPinterestUrls] = useState<string[]>([]);
  const [pinPreviews, setPinPreviews] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [loadingPins, setLoadingPins] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    accepted.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        const format = file.type.split('/')[1] || 'jpeg';
        setImages((prev) => [...prev, { dataBase64: base64, format, previewUrl: result }]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
  });

  const addPinterestUrl = async () => {
    const url = pinterestUrl.trim();
    if (!url) return;
    setLoadingPins(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/inspiration/pinterest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || 'Could not read that Pinterest URL');
      }
      const data = await res.json();
      setPinterestUrls((prev) => [...prev, url]);
      setPinPreviews((prev) => [...prev, ...(data.image_urls || []).slice(0, 6)]);
      setPinterestUrl('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Pinterest import failed');
    } finally {
      setLoadingPins(false);
    }
  };

  const generate = async () => {
    if (!text && pinterestUrls.length === 0 && images.length === 0) {
      setError('Add a Pinterest link, an image, or describe your taste first.');
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/inspiration/taste`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          text: text || null,
          pinterest_urls: pinterestUrls,
          images: images.map((i) => ({ data_base64: i.dataBase64, format: i.format })),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || 'Taste extraction failed');
      }
      const data = await res.json();
      setTasteProfile(data.taste_profile as TasteProfile);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not generate taste profile');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-5 p-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Your Inspiration</h2>
        <p className="text-sm text-gray-500">
          Add Pinterest links, photos, or describe your taste. Qwen reads it and shapes your design.
        </p>
      </div>

      {/* Pinterest URL */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Pinterest pin or board URL</label>
        <div className="flex gap-2">
          <input
            value={pinterestUrl}
            onChange={(e) => setPinterestUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addPinterestUrl()}
            placeholder="https://pinterest.com/pin/..."
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
          />
          <button
            onClick={addPinterestUrl}
            disabled={loadingPins}
            className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
          >
            {loadingPins ? '...' : 'Add'}
          </button>
        </div>
        {pinPreviews.length > 0 && (
          <div className="mt-2 grid grid-cols-3 gap-1">
            {pinPreviews.map((src) => (
              <img key={src} src={src} alt="Pinterest inspiration" className="h-16 w-full rounded object-cover" />
            ))}
          </div>
        )}
      </div>

      {/* Image upload */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Upload inspiration images</label>
        <div
          {...getRootProps()}
          className={`rounded-lg border-2 border-dashed p-4 text-center text-sm cursor-pointer transition-colors ${
            isDragActive ? 'border-amber-500 bg-amber-50' : 'border-gray-300 hover:border-amber-400'
          }`}
        >
          <input {...getInputProps()} />
          <span className="text-gray-500">Drop images or click to browse</span>
        </div>
        {images.length > 0 && (
          <div className="mt-2 grid grid-cols-3 gap-1">
            {images.map((img, i) => (
              <img key={i} src={img.previewUrl} alt="Inspiration" className="h-16 w-full rounded object-cover" />
            ))}
          </div>
        )}
      </div>

      {/* Free text */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Describe your taste (optional)</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="warm, earthy, lots of wood and plants, calm and minimal..."
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
        />
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <button
        onClick={generate}
        disabled={generating}
        className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {generating ? 'Reading your taste...' : '✨ Generate Taste Profile'}
      </button>

      {tasteProfile && <TasteProfileCard profile={tasteProfile} />}
    </div>
  );
}

function TasteProfileCard({ profile }: { profile: TasteProfile }) {
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold capitalize text-gray-900">{profile.primaryStyle}</h3>
        <span className="text-xs text-gray-500">
          {Math.round((profile.confidence ?? 0) * 100)}% confident
        </span>
      </div>

      <p className="mt-2 text-sm text-gray-700">{profile.summary}</p>

      <div className="mt-3 flex flex-wrap gap-1">
        {profile.styleKeywords?.map((k) => (
          <span key={k} className="rounded-full bg-white px-2 py-0.5 text-xs text-gray-700 border border-gray-200">
            {k}
          </span>
        ))}
      </div>

      <div className="mt-3">
        <p className="text-xs font-medium text-gray-600">Palette</p>
        <div className="mt-1 flex gap-2">
          {profile.colorPalette?.map((c, i) => (
            <div key={i} className="h-6 w-6 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: c }} title={c} />
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1">
        {profile.materials?.map((m) => (
          <span key={m} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{m}</span>
        ))}
      </div>

      {profile.keyFurniturePieces?.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-gray-600">Key pieces</p>
          <p className="mt-1 text-sm text-gray-700">{profile.keyFurniturePieces.join(', ')}</p>
        </div>
      )}

      <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
        <span>Mood: {profile.mood}</span>
        <span>•</span>
        <span>Lighting: {profile.lighting}</span>
      </div>
    </div>
  );
}
