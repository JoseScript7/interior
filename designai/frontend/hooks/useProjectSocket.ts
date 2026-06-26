'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Single WebSocket channel (per SAD Q5) — carries pipeline progress, render
 * results, async 3D asset swap-ins, and assistant actions.
 * Mirrors shared/contracts/websocket/messages.json.
 */

export interface PipelineProgressMsg {
  type: 'pipeline_progress';
  projectId: string;
  stage: string;
  percent: number;
  message?: string;
}
export interface PipelineCompleteMsg {
  type: 'pipeline_complete';
  projectId: string;
  status: string;
}
export interface RenderCompleteMsg {
  type: 'render_complete';
  projectId: string;
  imageUrl: string;
  beforeUrl?: string;
  themePreviewUrl?: string;
  themePreviewFallback?: boolean;
}
export interface RenderTimeoutMsg {
  type: 'render_timeout';
  projectId: string;
  reason: string;
}
export interface AssetReadyMsg {
  type: 'asset_ready';
  projectId: string;
  itemId: string;
  glbUrl: string;
}

export type SocketMessage =
  | PipelineProgressMsg
  | PipelineCompleteMsg
  | RenderCompleteMsg
  | RenderTimeoutMsg
  | AssetReadyMsg
  | { type: string; [k: string]: unknown };

interface UseProjectSocketResult {
  connected: boolean;
  progress: PipelineProgressMsg | null;
  renderResult: RenderCompleteMsg | null;
  renderError: string | null;
  lastAssetReady: AssetReadyMsg | null;
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || '';

export function useProjectSocket(
  projectId: string,
  onMessage?: (msg: SocketMessage) => void,
): UseProjectSocketResult {
  const [connected, setConnected] = useState(false);
  const [progress, setProgress] = useState<PipelineProgressMsg | null>(null);
  const [renderResult, setRenderResult] = useState<RenderCompleteMsg | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [lastAssetReady, setLastAssetReady] = useState<AssetReadyMsg | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const handle = useCallback((msg: SocketMessage) => {
    // Ignore messages for other projects
    if ('projectId' in msg && msg.projectId && msg.projectId !== projectId) return;
    switch (msg.type) {
      case 'pipeline_progress':
        setProgress(msg as PipelineProgressMsg);
        break;
      case 'render_complete':
        setRenderResult(msg as RenderCompleteMsg);
        setRenderError(null);
        break;
      case 'render_timeout':
        setRenderError((msg as RenderTimeoutMsg).reason || 'Render timed out');
        break;
      case 'asset_ready':
        setLastAssetReady(msg as AssetReadyMsg);
        break;
    }
    onMessageRef.current?.(msg);
  }, [projectId]);

  useEffect(() => {
    if (!WS_URL) {
      // No WS configured (local dev without deployed API) — degrade silently.
      return;
    }
    let closed = false;
    let retry: ReturnType<typeof setTimeout>;

    const connect = () => {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        if (!closed) retry = setTimeout(connect, 3000); // auto-reconnect
      };
      ws.onerror = () => ws.close();
      ws.onmessage = (e) => {
        try {
          handle(JSON.parse(e.data));
        } catch {
          /* ignore malformed frames */
        }
      };
    };

    connect();
    return () => {
      closed = true;
      clearTimeout(retry);
      wsRef.current?.close();
    };
  }, [handle]);

  return { connected, progress, renderResult, renderError, lastAssetReady };
}
