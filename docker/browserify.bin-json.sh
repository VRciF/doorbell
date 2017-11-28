#!/bin/bash

sudo npm install --save-dev babel-cli
sudo npm install babel-preset-es2015 babel-preset-stage-2
npm build
pushd bin-json-0.3.1; ./node_modules/.bin/babel src/ --ignore __tests__ --minified -o dist/bundle; popd
sudo npm install -g browserify
sudo npm install --save-dev babelify babel-preset-es2015 babel-preset-react
sudo npm install --save-dev babel-core
browserify bin-json-0.3.1/dist/bundle.js -o bin-json.0.3.1.min.js -t [ babelify --presets [ es2015 react ] ]

