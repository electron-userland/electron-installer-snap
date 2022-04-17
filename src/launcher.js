'use strict'
/*
Copyright 2018, 2019 Mark Lee and contributors

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

function getBrowserSandboxFlag (data) {
  if (data.apps) {
    const plugs = data.apps[`${data.name}`].plugs
    return plugs.includes('browser-sandbox') ? '' : '--no-sandbox'
  }
  return ''
}

async function copyLauncher (snapDir, config) {
  const binDir = path.join(snapDir, 'bin')
  let launcherPath = path.resolve(__dirname, '..', 'resources', 'desktop-launcher.sh')
  if (config.confinement === 'classic') {
    launcherPath = path.resolve(__dirname, '..', 'resources', 'classic', 'classic-launcher.sh')
  }
  await fs.mkdirs(binDir)
  await fs.copy(launcherPath, path.join(binDir, 'electron-launch'))
}

function createDesktopLaunchCommand (data) {
  const executableName = data.executableName || data.productName || data.name

  delete data.executableName
  delete data.productName

  const sandboxFlag = getBrowserSandboxFlag(data)

  return `bin/electron-launch $SNAP/${data.name}/${executableName} ${sandboxFlag}`
}

module.exports = {
  copyLauncher: copyLauncher,
  createDesktopLaunchCommand: createDesktopLaunchCommand
}
