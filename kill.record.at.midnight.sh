#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

while [ 1 ]
do
    pushd $DIR >/dev/null
    untilMidnight=$((`date +%s` % 86400))
    sleep $untilMidnight
    killall arecord
    popd >/dev/null
    sleep 1
done
