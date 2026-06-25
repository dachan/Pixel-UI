"""Camera abstraction.

A single ``BaseCamera`` interface with two implementations selected at runtime
by :func:`get_camera`, keyed on the ``CAMERA`` env var:

    CAMERA=real  -> RealCamera   (Raspberry Pi, picamera2)
    otherwise    -> MockCamera   (Mac dev, Pillow-synthesized frames)

IMPORTANT: ``picamera2`` is imported lazily inside ``RealCamera.__init__`` and is
NOT a declared dependency (requirements.txt). On the Pi it comes from apt
(python3-picamera2) via a venv created with --system-site-packages. Keeping the
import out of module scope is what lets this module import cleanly on the Mac.
"""

from __future__ import annotations

import abc
import io
import math
import os
import threading
import time
from datetime import datetime


class BaseCamera(abc.ABC):
    """Interface shared by the mock and real cameras."""

    @abc.abstractmethod
    def stream(self):
        """Yield raw JPEG bytes (one complete frame per iteration)."""
        raise NotImplementedError

    @abc.abstractmethod
    def capture(self, path: str) -> None:
        """Capture a single still and write it to ``path`` as JPEG."""
        raise NotImplementedError


class MockCamera(BaseCamera):
    """Synthesizes JPEG frames with Pillow so the dev stream is visibly live.

    Each frame draws a moving circle (position driven by wall-clock time) plus a
    live timestamp, so it is obvious the feed is a real stream and not a frozen
    image.
    """

    WIDTH = 1280
    HEIGHT = 720
    FPS = 10

    def _render_frame(self):
        from PIL import Image, ImageDraw

        img = Image.new("RGB", (self.WIDTH, self.HEIGHT), (18, 18, 24))
        draw = ImageDraw.Draw(img)

        # Moving circle: travels horizontally on a sine-driven vertical path.
        t = time.time()
        x = int((math.sin(t * 0.9) * 0.5 + 0.5) * (self.WIDTH - 120) + 60)
        y = int((math.sin(t * 1.7) * 0.5 + 0.5) * (self.HEIGHT - 120) + 60)
        r = 48
        draw.ellipse((x - r, y - r, x + r, y + r), fill=(80, 200, 255))

        # Live timestamp so a frozen frame is immediately obvious.
        stamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
        draw.text((20, 20), f"MOCK CAMERA  {stamp}", fill=(240, 240, 240))

        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=80)
        return buf.getvalue()

    def stream(self):
        interval = 1.0 / self.FPS
        while True:
            start = time.time()
            yield self._render_frame()
            elapsed = time.time() - start
            if elapsed < interval:
                time.sleep(interval - elapsed)

    def capture(self, path: str) -> None:
        with open(path, "wb") as f:
            f.write(self._render_frame())


class RealCamera(BaseCamera):
    """Raspberry Pi camera via picamera2.

    Streams MJPEG through a :class:`StreamingOutput` (an ``io.BufferedIOBase``
    guarded by a ``threading.Condition``) fed by picamera2's ``MJPEGEncoder``.
    """

    WIDTH = 1280
    HEIGHT = 720

    class StreamingOutput(io.BufferedIOBase):
        """Receives encoded JPEG frames from the MJPEGEncoder file output."""

        def __init__(self):
            self.frame = None
            self.condition = threading.Condition()

        def write(self, buf):
            with self.condition:
                self.frame = buf
                self.condition.notify_all()
            return len(buf)

    def __init__(self):
        # Lazy, Pi-only imports — never at module scope (see module docstring).
        from picamera2 import Picamera2
        from picamera2.encoders import MJPEGEncoder
        from picamera2.outputs import FileOutput

        self._Picamera2 = Picamera2
        self._picam2 = Picamera2()

        video_config = self._picam2.create_video_configuration(
            main={"size": (self.WIDTH, self.HEIGHT)}
        )
        self._picam2.configure(video_config)

        self._output = self.StreamingOutput()
        self._picam2.start_recording(MJPEGEncoder(), FileOutput(self._output))

    def stream(self):
        while True:
            with self._output.condition:
                self._output.condition.wait()
                frame = self._output.frame
            if frame is not None:
                yield frame

    def capture(self, path: str) -> None:
        # Still capture using a separate request; works while recording.
        request = self._picam2.capture_request()
        try:
            request.save("main", path)
        finally:
            request.release()


def get_camera() -> BaseCamera:
    """Factory: ``CAMERA=real`` -> RealCamera, anything else -> MockCamera."""
    if os.environ.get("CAMERA") == "real":
        return RealCamera()
    return MockCamera()
