'use strict'
/*
Copyright 2018 Mark Lee and contributors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

const fs = require('fs-extra')
const path = require('path')

function copyLauncher (snapDir, config) {
  if (config.confinement === 'classic') {
    const binDir = path.join(snapDir, 'bin')
    const launcherPath = path.resolve(__dirname, '..', 'resources', 'classic-launcher.sh')
    return fs.mkdirs(binDir)
      .then(() => fs.copy(launcherPath, path.join(binDir, 'electron-launch')))
  }

  return Promise.resolve()
}

function createDesktopLaunchCommand (data) {
  const executableName = data.executableName || data.productName

  delete data.executableName
  delete data.productName

  const launcher = data.confinement === 'classic' ? 'bin/electron-launch' : 'desktop-launch'

  return `${launcher} '$SNAP/${data.name}/${executableName}'`
}

module.exports = {
  copyLauncher: copyLauncher,
  createDesktopLaunchCommand: createDesktopLaunchCommand
}
