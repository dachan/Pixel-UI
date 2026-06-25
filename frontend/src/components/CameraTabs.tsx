"use client";

import { useState } from "react";
import { CameraPreview } from "@/components/CaptureView";
import CameraControls from "@/components/CameraControls";
import CameraMeta from "@/components/CameraMeta";
import CaptureGallery from "@/components/CaptureGallery";
import Tabs from "@/components/Tabs";

const TABS = [
  { id: "camera", label: "Camera" },
  { id: "meta", label: "Meta" },
  { id: "gallery", label: "Gallery" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function CameraTabs() {
  const [active, setActive] = useState<TabId>("camera");

  return (
    <div className="flex w-full flex-1 flex-col gap-3 overflow-hidden">
      <Tabs tabs={TABS} active={active} onChange={setActive} />

      <div className="min-h-0 flex-1 w-full overflow-hidden">
        {active === "camera" ? (
          <div className="grid h-full min-h-0 w-full grid-cols-[minmax(0,1fr)_18rem] gap-4">
            <div className="min-h-0 h-full">
              <CameraPreview />
            </div>
            <div className="relative min-h-0 h-full">
              <CameraControls />
            </div>
          </div>
        ) : active === "meta" ? (
          <div className="h-full min-h-0 text-sm">
            <CameraMeta />
          </div>
        ) : (
          <CaptureGallery />
        )}
      </div>
    </div>
  );
}
