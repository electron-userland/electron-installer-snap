#!/bin/bash -e

cd /code

npm run lint
CI=true npm run coverage
