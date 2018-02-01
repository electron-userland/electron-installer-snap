# Electron Installer: Snap

[![Build Status](https://travis-ci.org/electron-userland/electron-installer-snap.svg?branch=master)](https://travis-ci.org/electron-userland/electron-installer-snap)
[![Code Coverage](https://codecov.io/gh/electron-userland/electron-installer-snap/branch/master/graph/badge.svg)](https://codecov.io/gh/electron-userland/electron-installer-snap)

Builds Snap files for Electron applications that have already been bundled and customized.

## Requirements

Requires Node 4 or greater, and [`snapcraft`](https://snapcraft.io).

## Quick Start

The easiest way is to use [Electron Forge](https://electronforge.io) and enable the `snap` maker.

To use this as a standalone CLI, install `electron-installer-snap` to your project:

```shell
npm install --save-dev electron-installer-snap
# or
yarn add --dev electron-installer-snap
```

Then add to your `package.json`:

```javascript
{
  // ...
  "scripts": {
    "build:package": "electron-packager . --out=out"
    "build:snap": "electron-installer-snap --src=out/myappname-linux-x64"
  },
  // ...
}
```

Then you can run `npm run build:package && npm run build:snap`, which will prepare the Electron app
for bundling and generate a `.snap` file in your current directory.
It is recommended to ignore the generated `snap` directory in your version control.

## Options

Available command-line options are displayed when you run `electron-installer-snap --help`.

For the JavaScript API, please see the [API
docs](https://github.com/electron-userland/electron-installer-snap/blob/master/docs/api.md).

## Thanks

Thank you to Canonical for the support in getting this module created, during the September 2017
Ubuntu Rally and the January 2018 Snapcraft Summit.

## Legal

This project is copyrighted under the Apache License (version 2). See LICENSE for details.
