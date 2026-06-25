"use client";

import { useState } from "react";
import { capture, previewUrl } from "@/lib/camera-api";

// Minimal proof-of-loop UI: live MJPEG preview + a capture button.
// Intentionally simple — the real UI gets built on top of this.
export default function CaptureView() {
  const [busy, setBusy] = useState(false);
  const [lastFile, setLastFile] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onCapture() {
    setBusy(true);
    setError(null);
    try {
      const { filename } = await capture();
      setLastFile(filename);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* The live preview is a plain <img> pointed at the MJPEG stream. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={previewUrl()}
        alt="Live camera preview"
        className="w-full max-w-2xl rounded-lg border border-zinc-700 bg-black"
      />

      <button
        onClick={onCapture}
        disabled={busy}
        className="rounded-full bg-blue-600 px-8 py-3 font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
      >
        {busy ? "Capturing…" : "Capture"}
      </button>

      {lastFile && (
        <p className="text-sm text-green-500">Saved: {lastFile}</p>
      )}
      {error && <p className="text-sm text-red-500">Error: {error}</p>}
    </div>
  );
}
