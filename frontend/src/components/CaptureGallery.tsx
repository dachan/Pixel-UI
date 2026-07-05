"use client";

import { useCallback, useEffect, useState } from "react";
import { captureUrl, listCaptures } from "@/lib/camera-api";
import { useDragScroll } from "@/lib/use-drag-scroll";

export default function CaptureGallery() {
  const scrollRef = useDragScroll<HTMLDivElement>();
  const [captures, setCaptures] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Filename of the capture opened full-screen (null = grid view).
  const [selected, setSelected] = useState<string | null>(null);

  const refresh = useCallback(() => {
    listCaptures()
      .then(setCaptures)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 3000);
    return () => clearInterval(id);
  }, [refresh]);

  if (error) {
    return (
      <p className="flex h-full items-center justify-center text-sm text-red-500">
        Captures unavailable: {error}
      </p>
    );
  }

  if (loading) {
    return (
      <p className="flex h-full items-center justify-center text-sm text-zinc-500">
        Loading captures…
      </p>
    );
  }

  if (captures.length === 0) {
    return (
      <p className="flex h-full items-center justify-center text-sm text-zinc-500">
        No captures yet. Use the Capture button on the Camera tab.
      </p>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="h-full min-h-0 overflow-y-auto touch-pan-y overscroll-contain scrollbar-none [&::-webkit-scrollbar]:hidden"
    >
      <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {captures.map((filename) => (
          <figure
            key={filename}
            onClick={() => setSelected(filename)}
            className="cursor-pointer overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50 transition hover:border-zinc-600"
          >
            <img
              src={captureUrl(filename)}
              alt={filename}
              className="aspect-video w-full object-cover"
            />
            <figcaption className="truncate px-2 py-1.5 font-mono text-xs text-zinc-400">
              {filename}
            </figcaption>
          </figure>
        ))}
      </div>

      {selected && (
        <div
          role="dialog"
          aria-label={selected}
          onClick={() => setSelected(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
        >
          <img
            src={captureUrl(selected)}
            alt={selected}
            className="max-h-full max-w-full object-contain"
          />
          <span className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded bg-black/60 px-2 py-1 font-mono text-xs text-zinc-300">
            {selected} · tap to close
          </span>
        </div>
      )}
    </div>
  );
}
