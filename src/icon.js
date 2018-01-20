'use strict'
/*
Copyright 2017 Mark Lee and contributors

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

function getSourceIconPath (userSupplied) {
  if (userSupplied.icon) {
    const iconPath = path.resolve(userSupplied.icon)
    delete userSupplied.icon
    return iconPath
  } else {
    return path.resolve(__dirname, '..', 'resources', 'icon.png')
  }
}

function copyIcon (snapGuiDir, userSupplied) {
  const srcIconPath = getSourceIconPath(userSupplied)
  const destIconPath = path.resolve(snapGuiDir, `icon${path.extname(srcIconPath)}`)
  return fs.copy(srcIconPath, destIconPath)
}

module.exports = copyIcon
