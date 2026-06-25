// Single entry point for all camera API calls.
//
// BASE comes from NEXT_PUBLIC_API_BASE, baked in at build time.
//   - dev:  http://localhost:5000  (frontend on :3000 talks cross-origin)
//   - prod: "" (empty) -> relative "/api", served single-origin by Flask (kiosk)

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export function previewUrl(): string {
  return `${BASE}/api/preview`;
}

export async function capture(): Promise<{ filename: string }> {
  const res = await fetch(`${BASE}/api/capture`, { method: "POST" });
  if (!res.ok) throw new Error(`capture failed: ${res.status}`);
  return res.json();
}

// --- Camera metadata --------------------------------------------------------

export type ControlRange = {
  min: number | boolean | null;
  max: number | boolean | null;
  default: number | boolean | null;
};

export type CameraInfo = {
  properties: Record<string, unknown>;
  controls: Record<string, ControlRange>;
};

export type CameraMetadata = Record<string, unknown>;

export async function cameraInfo(): Promise<CameraInfo> {
  const res = await fetch(`${BASE}/api/camera/info`);
  if (!res.ok) throw new Error(`camera info failed: ${res.status}`);
  return res.json();
}

export async function cameraMetadata(): Promise<CameraMetadata> {
  const res = await fetch(`${BASE}/api/camera/metadata`);
  if (!res.ok) throw new Error(`camera metadata failed: ${res.status}`);
  return res.json();
}

// --- Exposure controls (ISO + shutter; aperture is fixed on Pi cameras) -----

export type CameraControlsState = {
  auto_exposure: boolean;
  iso: number;
  shutter_us: number;
};

export async function getControls(): Promise<CameraControlsState> {
  const res = await fetch(`${BASE}/api/camera/controls`);
  if (!res.ok) throw new Error(`get controls failed: ${res.status}`);
  return res.json();
}

export async function setControls(
  settings: Partial<CameraControlsState>,
): Promise<CameraControlsState> {
  const res = await fetch(`${BASE}/api/camera/controls`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error(`set controls failed: ${res.status}`);
  return res.json();
}
