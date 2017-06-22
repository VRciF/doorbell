#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

while [ 1 ]
do
    pushd $DIR >/dev/null
    rm -f ./record/*.mp3
    echo "" > ./audio.log
#    arecord -D plughw:1 -f cd - | ffmpeg -i - -f segment -strftime 1 -segment_time 86400 -segment_format mp3 record/out.mp3 > audio.log 2>&1
#    arecord -D plughw:1 -f cd - | ffmpeg -i - -c:a libmp3lame -b:a 32k -map 0:0 -f segment -segment_time 1 -segment_list outputlist.m3u8 -segment_format mpegts 'record/output%03d.mp3'
#    arecord -D plughw:1 -f cd - | ffmpeg -i - -c:a libmp3lame -b:a 32k -map 0:0 -f segment -segment_time 0.25 -segment_format mpegts -segment_wrap 10 'record/output%01d.mp3' >mic.log 2>&1

    # oga is the way to go - seems working really well, mp3 codecs just add silence at beginning and end and thus cause crackling noises in the browser
    arecord -D plughw:1 -f cd - | ffmpeg -loglevel error -i - -c:a libvorbis -b:a 85k -map 0:0 -f segment -segment_time 0.5 -segment_wrap 10 'record/output%01d.oga'

    popd >/dev/null
    sleep 1
done
