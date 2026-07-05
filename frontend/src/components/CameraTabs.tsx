"use client";

import { useEffect, useState } from "react";
import { CameraPreview } from "@/components/CaptureView";
import CameraControls from "@/components/CameraControls";
import CameraMeta from "@/components/CameraMeta";
import CaptureGallery from "@/components/CaptureGallery";
import CameraSettings from "@/components/CameraSettings";
import Tabs from "@/components/Tabs";

const TABS = [
  { id: "camera", label: "Camera" },
  { id: "meta", label: "Meta" },
  { id: "gallery", label: "Gallery" },
  { id: "settings", label: "Settings" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function CameraTabs() {
  const [active, setActive] = useState<TabId>("camera");
  // Rule-of-thirds overlay on the live preview; defaults on, persisted locally.
  const [showGrid, setShowGrid] = useState(true);
  // On-screen Capture button; defaults on. Off is for setups relying solely
  // on the physical GPIO shutter button, to keep the kiosk UI uncluttered.
  const [showCaptureButton, setShowCaptureButton] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("showGrid");
    if (stored !== null) setShowGrid(stored === "true");
    const storedCapture = localStorage.getItem("showCaptureButton");
    if (storedCapture !== null) setShowCaptureButton(storedCapture === "true");
  }, []);

  function toggleGrid(next: boolean) {
    setShowGrid(next);
    localStorage.setItem("showGrid", String(next));
  }

  function toggleCaptureButton(next: boolean) {
    setShowCaptureButton(next);
    localStorage.setItem("showCaptureButton", String(next));
  }

  return (
    <div className="flex w-full flex-1 flex-col gap-3 overflow-hidden">
      <Tabs tabs={TABS} active={active} onChange={setActive} />

      <div className="min-h-0 flex-1 w-full">
        {active === "camera" ? (
          <div className="flex gap-4 w-full h-full">
            <div className="w-2/3 flex items-center justify-center overflow-hidden h-full">
              <CameraPreview showGrid={showGrid} />
            </div>
            <div className="w-1/3">
              <CameraControls showCaptureButton={showCaptureButton} />
            </div>
          </div>
        ) : active === "meta" ? (
          <CameraMeta />
        ) : active === "gallery" ? (
          <CaptureGallery />
        ) : (
          <CameraSettings
            showGrid={showGrid}
            onGridChange={toggleGrid}
            showCaptureButton={showCaptureButton}
            onCaptureButtonChange={toggleCaptureButton}
          />
        )}
      </div>
    </div>
  );
}
