#!/bin/bash

# kiosk mode see: https://blogs.wcode.org/2013/09/howto-boot-your-raspberry-pi-into-a-fullscreen-browser-kiosk/
sudo apt-get update
sudo apt-get dist-upgrade
sudo apt-get install matchbox chromium-browser x11-xserver-utils ttf-mscorefonts-installer xwit sqlite3 libnss3



