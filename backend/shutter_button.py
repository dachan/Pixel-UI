"""Physical shutter-button support via GPIO (Raspberry Pi only).

Wraps ``gpiozero.Button``, imported lazily so this module has no effect (and
no hard dependency) off the Pi — mirroring how ``picamera2`` is handled in
camera.py. Only wired up when ``CAMERA=real`` (see app.py).
"""

from __future__ import annotations

import os
import threading

# BCM pin the button is wired to (button between the pin and GND, using the
# Pi's internal pull-up — pressed pulls the pin LOW). Override with the
# SHUTTER_GPIO_PIN env var if wired to a different pin.
DEFAULT_PIN = 17


def start_shutter_button(on_press):
    """Start listening for shutter-button presses; calls ``on_press()`` on each.

    Runs on gpiozero's own background thread. A press received while a prior
    ``on_press`` call is still running is dropped rather than queued, since a
    capture briefly stops and restarts the preview stream.
    """
    from gpiozero import Button

    pin = int(os.environ.get("SHUTTER_GPIO_PIN", DEFAULT_PIN))
    button = Button(pin, pull_up=True, bounce_time=0.2)

    busy = threading.Lock()

    def _handle_press():
        if not busy.acquire(blocking=False):
            return
        try:
            on_press()
        finally:
            busy.release()

    button.when_pressed = _handle_press
    return button  # keep a reference alive so it isn't garbage-collected
