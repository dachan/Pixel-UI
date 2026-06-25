"use client";

import { previewUrl } from "@/lib/camera-api";

export function CameraPreview() {
  return (
    <div className="h-full w-full overflow-hidden rounded-lg border border-zinc-700 bg-black">
      <img
        src={previewUrl()}
        alt="Live camera preview"
        className="h-full w-full object-cover"
      />
    </div>
  );
}
