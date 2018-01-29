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

const asar = require('asar')
const debug = require('debug')('electron-installer-snap:default_args')
const fs = require('fs-extra')
const path = require('path')

function defaultArgsFromPackageJSON (packageJSON) {
  return {
    name: packageJSON.name,
    productName: packageJSON.productName || packageJSON.name,
    version: packageJSON.version,
    summary: packageJSON.description
  }
}

function defaultArgsFromAsar (asarFilename) {
  const packageJSON = JSON.parse(asar.extractFile(asarFilename, 'package.json'))
  return defaultArgsFromPackageJSON(packageJSON)
}

function defaultArgsFromPackageJSONFile (packageDir, resourcesDir) {
  return fs.readJson(path.join(resourcesDir, 'app', 'package.json'))
    .catch(err => {
      throw new Error(`Could not find, read, or parse package.json in packaged app '${packageDir}':\n${err.message}`)
    }).then(packageJSON => defaultArgsFromPackageJSON(packageJSON))
}

function defaultArgsFromApp (packageDir) {
  const resourcesDir = path.resolve(packageDir, 'resources')
  const asarFilename = path.join(resourcesDir, 'app.asar')
  return fs.pathExists(asarFilename)
    .then(asarExists => {
      if (asarExists) {
        debug('Loading package.json defaults from', asarFilename)
        return defaultArgsFromAsar(asarFilename)
      } else {
        debug('Loading package.json defaults from', packageDir)
        return defaultArgsFromPackageJSONFile(packageDir, resourcesDir)
      }
    })
}

module.exports = defaultArgsFromApp
