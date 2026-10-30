/**
 * Server-Sent Events consumer for GET /v1/readings/:id/stream (and future /v1/ai/ask streaming).
 * Event names today: `engine_summary`, `done`, `error`. Future (P8): `section`, `delta`.
 * Uses `expo/fetch` on native (streaming bodies) and the global fetch on web; falls back to
 * reading the whole body when streaming is unavailable.
 */
import { fetch as expoFetch } from 'expo/fetch';
import { Platform } from 'react-native';

export interface SseEvent {
  event: string;
  data: string;
  id?: string;
}

/** Incremental SSE parser (keeps partial frames between chunks). */
export function createSseParser(onEvent: (e: SseEvent) => void) {
  let buffer = '';
  const flushFrame = (frame: string) => {
    if (!frame.trim()) return;
    let event = 'message';
    let id: string | undefined;
    const data: string[] = [];
    for (const raw of frame.split('\n')) {
      const line = raw.replace(/\r$/, '');
      if (!line || line.startsWith(':')) continue;
      const idx = line.indexOf(':');
      const field = idx === -1 ? line : line.slice(0, idx);
      const value = idx === -1 ? '' : line.slice(idx + 1).replace(/^ /, '');
      if (field === 'event') event = value;
      else if (field === 'data') data.push(value);
      else if (field === 'id') id = value;
    }
    if (data.length) onEvent({ event, data: data.join('\n'), id });
  };
  return {
    push(chunk: string) {
      buffer += chunk;
      let idx: number;
      while ((idx = buffer.search(/\n\n|\r\n\r\n/)) !== -1) {
        const sep = buffer.startsWith('\r\n\r\n', idx) ? 4 : 2;
        flushFrame(buffer.slice(0, idx));
        buffer = buffer.slice(idx + sep);
      }
    },
    end() {
      flushFrame(buffer);
      buffer = '';
    },
  };
}

export interface EngineSummaryEvent {
  readingId: string;
  kind: string;
  engine: string | null;
  atomKeys: string[];
  confidence: string | null;
  warnings: Array<{ code: string; message: string }>;
}
export interface SectionEvent {
  index?: number;
  title: string;
  body: string;
  atomRefs?: string[];
}
export interface DeltaEvent {
  index?: number;
  text: string;
}
export interface DoneEvent {
  readingId: string;
  ai: 'ready' | 'pending' | string;
  summary?: string;
  actions?: string[];
  caveats?: string[];
  disclaimer?: string;
  costUsd?: number;
  usedFallbackTemplate?: boolean;
}

export interface StreamHandlers {
  onEngineSummary?: (e: EngineSummaryEvent) => void;
  onSection?: (e: SectionEvent) => void;
  onDelta?: (e: DeltaEvent) => void;
  onDone?: (e: DoneEvent) => void;
  onError?: (e: { code: string; message?: string }) => void;
  onUnknown?: (e: SseEvent) => void;
}

function dispatch(e: SseEvent, h: StreamHandlers) {
  let payload: unknown = e.data;
  try {
    payload = JSON.parse(e.data);
  } catch {
    /* plain text data */
  }
  switch (e.event) {
    case 'engine_summary':
      return h.onEngineSummary?.(payload as EngineSummaryEvent);
    case 'section':
      return h.onSection?.(payload as SectionEvent);
    case 'delta':
      return h.onDelta?.(typeof payload === 'string' ? { text: payload } : (payload as DeltaEvent));
    case 'done':
      return h.onDone?.(payload as DoneEvent);
    case 'error':
      return h.onError?.(typeof payload === 'string' ? { code: payload } : (payload as { code: string; message?: string }));
    default:
      return h.onUnknown?.(e);
  }
}

/** Opens the stream; resolves when the server closes it. Returns an abort function via `signal`. */
export async function consumeSse(url: string, headers: Record<string, string>, handlers: StreamHandlers, signal?: AbortSignal): Promise<void> {
  const parser = createSseParser((e) => dispatch(e, handlers));
  const doFetch = Platform.OS === 'web' ? fetch : (expoFetch as unknown as typeof fetch);
  const res = await doFetch(url, { headers: { accept: 'text/event-stream', ...headers }, signal });
  if (!res.ok) {
    let code = `http_${res.status}`;
    try {
      const j = (await res.json()) as { error?: string; reason?: string };
      code = j.reason ?? j.error ?? code;
    } catch {
      /* ignore */
    }
    handlers.onError?.({ code });
    return;
  }
  const body = res.body as ReadableStream<Uint8Array> | null;
  if (body && typeof body.getReader === 'function') {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) parser.push(decoder.decode(value, { stream: true }));
    }
    parser.end();
    return;
  }
  parser.push(await res.text());
  parser.end();
}
