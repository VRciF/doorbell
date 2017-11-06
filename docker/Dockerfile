# Dockerfile
FROM node:8

RUN echo "deb http://www.deb-multimedia.org jessie main non-free" >> /etc/apt/sources.list \
    && echo "deb-src http://www.deb-multimedia.org jessie main non-free" >> /etc/apt/sources.list \
    && apt-get update \
    && apt-get install -y --force-yes deb-multimedia-keyring \
    && apt-get update \
    && apt-get install -y ffmpeg alsa-utils

ADD ./ /home/node/app
WORKDIR /home/node/app
RUN npm install
