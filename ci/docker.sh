#!/bin/bash -e

cd /code

npm run lint
DEBUG=electron-installer-snap:snapcraft CI=true npm run coverage
