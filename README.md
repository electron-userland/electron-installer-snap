# Electron Installer: Snap

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
    "build:snap": "electron-installer-snap --dir=out/myappname-linux-x64"
  },
  // ...
}
```

Then you can run `npm run build:package && npm run build:snap`, which will prepare the Electron app
for bundling, generate a `.snap` file in your current directory.
It is recommended to ignore the generated `snap` directory in your version control.

## Thanks

Thank you to Canonical for the support in getting this module created, during the September 2017
Ubuntu Rally.

## Legal

This project is copyrighted under the Apache License (version 2). See LICENSE for details.
