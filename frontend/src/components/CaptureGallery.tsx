"use client";

import { useState } from "react";
import {
  captureThumbUrl,
  captureUrl,
  deleteCapture,
  listCaptures,
} from "@/lib/camera-api";
import { errorMessage } from "@/lib/errors";
import { usePolling } from "@/lib/use-polling";
import DragScrollArea from "@/components/DragScrollArea";
import Button from "@/components/_shared/Button";

export default function CaptureGallery() {
  const [captures, setCaptures] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Filename of the capture opened full-screen (null = grid view).
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function closeSelected() {
    setSelected(null);
    setConfirmingDelete(false);
  }

  function deleteSelected() {
    if (!selected || deleting) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      window.setTimeout(() => setConfirmingDelete(false), 4000);
      return;
    }

    setDeleting(true);
    deleteCapture(selected)
      .then(() => {
        setCaptures((current) => current.filter((name) => name !== selected));
        closeSelected();
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setDeleting(false));
  }

  usePolling(() => {
    listCaptures()
      .then((names) => {
        setCaptures(names);
        setError(null); // a later successful poll clears a transient failure
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, 3000);

  if (error) {
    return (
      <p className="flex size-full items-center justify-center text-center text-sm text-red-500">
        Captures unavailable: {error}
      </p>
    );
  }

  if (loading) {
    return (
      <p className="flex size-full items-center justify-center text-center text-sm text-stone-500">
        Loading captures…
      </p>
    );
  }

  if (captures.length === 0) {
    return (
      <p className="flex size-full items-center justify-center text-center text-sm text-stone-500">
        No captures yet. Use the Capture button on the Camera tab.
      </p>
    );
  }

  return (
    <DragScrollArea>
      <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {captures.map((filename) => (
          <figure
            key={filename}
            onClick={() => setSelected(filename)}
            className="cursor-pointer overflow-hidden rounded-md border border-stone-300 bg-stone-100 transition hover:border-orange-500"
          >
            <div className="flex aspect-video w-full items-center justify-center bg-stone-200">
              <img
                src={captureThumbUrl(filename)}
                alt={filename}
                loading="lazy"
                decoding="async"
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <figcaption className="truncate px-2 py-1.5 font-mono text-xs text-stone-500">
              {filename}
            </figcaption>
          </figure>
        ))}
      </div>

      {selected && (
        <div
          role="dialog"
          aria-label={selected}
          onClick={closeSelected}
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/95 p-4"
        >
          <div className="relative flex max-h-full max-w-full items-center justify-center">
            <img
              src={captureUrl(selected)}
              alt={selected}
              className="max-h-full max-w-full object-contain"
            />
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
              <Button
                variant="destructive"
                selected={confirmingDelete}
                disabled={deleting}
                onClick={(event) => {
                  event.stopPropagation();
                  deleteSelected();
                }}
                className="w-auto min-w-32 whitespace-nowrap"
              >
                {deleting
                  ? "Deleting…"
                  : confirmingDelete
                    ? "Confirm"
                    : "Delete Photo"}
              </Button>
              <Button
                variant="secondary"
                onClick={(event) => {
                  event.stopPropagation();
                  closeSelected();
                }}
                className="w-auto min-w-32 whitespace-nowrap"
              >
                Tap To Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </DragScrollArea>
  );
}
