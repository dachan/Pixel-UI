# Template — scripts/deploy.sh renders this into ~/.config/labwc/autostart,
# substituting __PI_DIR__. Boots the Pi straight into the kiosk while keeping
# a usable desktop underneath (so Exit-to-desktop lands somewhere real).

# Run the stock Raspberry Pi desktop session first (panel, file manager,
# display config). Sourced from the system autostart so it stays current with
# OS updates rather than being copied. This is what "regular Pi mode" shows.
if [ -f /etc/xdg/labwc/autostart ]; then
  . /etc/xdg/labwc/autostart
fi

# Then the kiosk on top. kiosk.sh does its own crash-respawn and honors a
# one-shot boot-to-desktop flag, so it is deliberately NOT wrapped in
# lwrespawn (which would relaunch it and defeat the desktop escape).
__PI_DIR__/kiosk.sh &
