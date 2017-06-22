#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

while [ 1 ]
do
    pushd $DIR/video >/dev/null
    find /opt/doorbell/video -name "*.jpg" -not -newermt '-15 seconds' -exec rm {} \;
    popd >/dev/null
    sleep 0.25
done

