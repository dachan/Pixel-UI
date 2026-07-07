#!/usr/bin/env bash
# Kiosk launcher for the Pi (Wayland/labwc). Launched at login from
# ~/.config/labwc/autostart (installed by scripts/deploy.sh), which also
# starts the normal desktop session — so if this script exits, a usable
# desktop remains underneath.
#
# Boots straight into the app fullscreen, EXCEPT when a one-shot
# "boot to desktop" was requested: the Exit-to-desktop button writes the
# flag below and reboots, and this honors it once (staying on the plain
# desktop), then clears it so the next boot returns to the kiosk.
set -euo pipefail

FLAG="${HOME}/.ircam-boot-to-desktop"
API_URL="http://localhost:5000"

# One-shot desktop escape: leave the normal desktop up this boot.
if [ -f "${FLAG}" ]; then
  rm -f "${FLAG}"
  exit 0
fi

# Wait for the Flask API to be healthy before opening the browser.
until curl -sf "${API_URL}/api/health" >/dev/null 2>&1; do
  sleep 1
done

# Find a chromium binary (Bookworm ships `chromium`; some images use chromium-browser).
CHROMIUM="$(command -v chromium || command -v chromium-browser)"

# Respawn Chromium if it crashes, but exit cleanly (to the desktop) if a
# boot-to-desktop was requested while running. NOT wrapped in lwrespawn —
# this loop is the respawn, so the flag can still break out to the desktop.
while true; do
  "${CHROMIUM}" \
    --kiosk \
    --app="${API_URL}" \
    --ozone-platform=wayland \
    --noerrdialogs \
    --disable-infobars \
    --disable-session-crashed-bubble \
    --check-for-update-interval=31536000 \
    --no-first-run \
    --password-store=basic || true
  [ -f "${FLAG}" ] && { rm -f "${FLAG}"; break; }
  sleep 1
done
