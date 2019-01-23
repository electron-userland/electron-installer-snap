'use strict'
/*
Copyright 2017, 2018, 2019 Mark Lee and contributors

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

const { createDesktopFile } = require('electron-installer-common')
const path = require('path')

function getDesktopTemplatePath (userSupplied) {
  if (userSupplied.desktopTemplate) {
    const desktopTemplatePath = path.resolve(userSupplied.desktopTemplate)
    delete userSupplied.desktopTemplate
    return desktopTemplatePath
  } else {
    return path.resolve(__dirname, '..', 'resources', 'desktop.ejs')
  }
}

function templateScope (userSupplied) {
  const defaults = {
    productName: null,
    description: null,
    genericName: null,
    name: null,
    categories: null,
    mimeType: null
  }
  return Object.assign(defaults, userSupplied)
}

module.exports = function (snapGuiDir, userSupplied) {
  return createDesktopFile(getDesktopTemplatePath(userSupplied), snapGuiDir, userSupplied.name, templateScope(userSupplied))
}
