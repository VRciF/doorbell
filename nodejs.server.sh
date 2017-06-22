#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

while [ 1 ]
do
    pushd $DIR >/dev/null
    rm -f ./record/*.mp3
    echo "starting node"
    node index.js >server.log 2>&1
    popd >/dev/null
    sleep 1
done

