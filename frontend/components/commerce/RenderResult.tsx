'use client';

import { BeforeAfterSlider } from './BeforeAfterSlider';
import type { RenderCompleteMsg } from '@/hooks/useProjectSocket';

interface Props {
  result: RenderCompleteMsg | null;
  rendering: boolean;
  error: string | null;
  progress?: number;
  onRetry?: () => void;
}

/**
 * Renders the two distinct render outputs (per resolved FR-4.4):
 *  - ControlNet geometry-preserving redesign  (imageUrl, in before/after slider)
 *  - SDXL/FLUX standalone theme preview        (themePreviewUrl)
 * Surfaces themePreviewFallback as an honest badge instead of silently swapping.
 */
export function RenderResult({ result, rendering, error, progress = 0, onRetry }: Props) {
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">Render failed: {error}</p>
        {onRetry && (
          <button onClick={onRetry} className="mt-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500">
            Try again
          </button>
        )}
      </div>
    );
  }

  if (rendering && !result) {
    return (
      <div className="rounded-xl border border-gray-200 p-4">
        <p className="text-sm text-gray-600 mb-2">Rendering… this takes about 45 seconds</p>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-purple-600 h-2 rounded-full transition-all duration-700" style={{ width: `${Math.max(8, progress)}%` }} />
        </div>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="space-y-4">
      {/* ControlNet geometry-preserving redesign */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Your Room, Redesigned</h3>
        {result.beforeUrl ? (
          <BeforeAfterSlider beforeUrl={result.beforeUrl} afterUrl={result.imageUrl} />
        ) : (
          <img src={result.imageUrl} alt="Redesigned room" className="w-full rounded-xl" />
        )}
        <p className="mt-1 text-xs text-gray-500">Geometry-preserving redesign (ControlNet)</p>
      </div>

      {/* SDXL/FLUX standalone theme preview (FR-4.4) */}
      {result.themePreviewUrl && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-semibold text-gray-900">Alternate Theme Preview</h3>
            {result.themePreviewFallback && (
              <span
                className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700"
                title="SDXL/FLUX.1 endpoint unavailable in this build; preview generated via ControlNet fallback. Same contract, swappable post-hackathon."
              >
                preview via fallback
              </span>
            )}
          </div>
          <img src={result.themePreviewUrl} alt="Alternate theme preview" className="w-full rounded-xl" />
          <p className="mt-1 text-xs text-gray-500">
            {result.themePreviewFallback
              ? 'Standalone theme preview (FR-4.4) — ControlNet fallback'
              : 'Standalone theme preview (SDXL/FLUX.1)'}
          </p>
        </div>
      )}
    </div>
  );
}
