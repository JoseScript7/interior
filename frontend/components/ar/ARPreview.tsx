'use client';

import { useEffect, useRef, useState } from 'react';

interface ARPreviewProps {
  glbUrl: string;
  productName?: string;
  onClose?: () => void;
}

/**
 * AR Furniture Preview Component
 * - Mobile (iOS/Android): Google's <model-viewer> with WebXR/SceneViewer/QuickLook
 * - Desktop: WebXR Device API with Three.js hit testing
 * - Fallback: 360° spin view
 */
export function ARPreview({ glbUrl, productName, onClose }: ARPreviewProps) {
  const [arSupported, setArSupported] = useState<boolean | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    setIsMobile(mobile);

    // Check WebXR support
    if (navigator.xr) {
      navigator.xr.isSessionSupported('immersive-ar').then(setArSupported);
    } else {
      setArSupported(false);
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 rounded-full bg-white/90 p-2 shadow-lg hover:bg-white"
        aria-label="Close AR preview"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="w-full h-full flex items-center justify-center p-4">
        {/* Mobile: model-viewer with AR */}
        {isMobile && (
          <div className="w-full h-full max-w-lg max-h-[80vh]">
            {/* @ts-ignore - model-viewer is a web component */}
            <model-viewer
              src={glbUrl}
              alt={productName || 'Furniture 3D model'}
              ar
              ar-modes="webxr scene-viewer quick-look"
              camera-controls
              auto-rotate
              shadow-intensity="1"
              style={{ width: '100%', height: '100%' }}
            >
              <button slot="ar-button" className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-xl bg-amber-600 px-6 py-3 text-white font-semibold shadow-lg">
                👆 View in Your Room
              </button>
            </model-viewer>
          </div>
        )}

        {/* Desktop with WebXR support */}
        {!isMobile && arSupported && (
          <div className="text-center text-white">
            <p className="text-lg mb-4">WebXR AR available on this device</p>
            <button className="rounded-xl bg-amber-600 px-6 py-3 text-white font-semibold">
              Enter AR
            </button>
            {/* In production: render Three.js Canvas with WebXR session + hit testing */}
          </div>
        )}

        {/* Fallback: 360° spin view */}
        {!isMobile && !arSupported && (
          <div className="text-center max-w-md">
            <div className="bg-gray-900 rounded-xl p-8 mb-4">
              {/* @ts-ignore */}
              <model-viewer
                src={glbUrl}
                alt={productName || 'Furniture 3D model'}
                camera-controls
                auto-rotate
                shadow-intensity="1"
                style={{ width: '100%', height: '400px' }}
              />
            </div>
            <p className="text-white text-sm">
              AR requires a mobile device or WebXR-compatible browser.
              Showing 360° preview instead.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
