# Template — scripts/deploy.sh renders this into ~/.config/labwc/autostart,
# substituting __PI_DIR__.
#
# labwc runs BOTH the system autostart (/etc/xdg/labwc/autostart, which starts
# the desktop session: panel, file manager, display config) AND this user
# autostart. So this file only adds the kiosk on top — do NOT source the
# system autostart here, or the panel and file manager launch twice (a
# doubled top bar).
#
# kiosk.sh does its own crash-respawn and honors a one-shot boot-to-desktop
# flag, so it is deliberately NOT wrapped in lwrespawn (which would relaunch
# it and defeat the desktop escape).
__PI_DIR__/kiosk.sh &
