#!/bin/bash

cd /code

DEBUG='electron-installer-snap:*' CI=true npm run coverage
