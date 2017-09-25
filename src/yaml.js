'use strict'
/*
Copyright [yyyy] [name of copyright owner]

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

const debug = require('debug')('electron-installer-snap:yaml')
const fs = require('fs-extra')
const merge = require('lodash/merge')
const path = require('path')
const yaml = require('js-yaml')

function defaultArgsFromPackageJSON (packageDir) {
  debug('Loading package.json defaults from', packageDir)
  return fs.readJson(path.resolve(packageDir, 'resources', 'app', 'package.json'))
    .then(packageJSON => {
      return {
        name: packageJSON.name,
        version: packageJSON.version,
        description: packageJSON.description
      }
    })
}

function readYaml (filename) {
  return fs.readFile(filename)
    .then(data => yaml.safeLoad(data, { filename: filename }))
}

function transformYaml (packageDir, yamlData, userSupplied) {
  return defaultArgsFromPackageJSON(packageDir)
    .then(packageJSONArgs => {
      merge(yamlData, packageJSONArgs, userSupplied)
      yamlData.parts[yamlData.name] = yamlData.parts.electronApp
      delete yamlData.parts.electronApp

      return yamlData
    })
}

function writeYaml (filename, data) {
  return fs.outputFile(filename, yaml.safeDump(data))
}

function createYamlFromTemplate (userSupplied) {
  const templateFilename = path.resolve(__dirname, '..', 'resources', 'snapcraft.yaml')
  const packageDir = path.resolve(userSupplied.dir)
  delete userSupplied.dir

  return readYaml(templateFilename)
    .then(yamlData => transformYaml(packageDir, yamlData, userSupplied))
    .then(yamlData => writeYaml(path.join(packageDir, 'snap', 'snapcraft.yaml'), yamlData))
}

module.exports = createYamlFromTemplate
