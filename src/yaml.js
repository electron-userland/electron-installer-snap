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
const debug = require('debug')('electron-installer-snap:yaml')
const fs = require('fs-extra')
const merge = require('lodash/merge')
const path = require('path')
const yaml = require('js-yaml')


function defaultArgsFromAsar (asarFilename) {
  const packageJSON = JSON.parse(asar.extractFile(asarFilename, 'package.json'))
  return {
    name: packageJSON.name,
    version: packageJSON.version,
    description: packageJSON.description
  }
}

function defaultArgsFromPackageJSON (resourcesDir) {
  return fs.readJson(path.join(resourcesDir, 'app', 'package.json'))
    .then(packageJSON => {
      return {
        name: packageJSON.name,
        version: packageJSON.version,
        description: packageJSON.description
      }
    })
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
        return defaultArgsFromPackageJSON(resourcesDir)
      }
    })
}

function readYaml (filename) {
  return fs.readFile(filename)
    .then(data => yaml.safeLoad(data, { filename: filename }))
}

function renameYamlSubtree (parentObject, fromKey, toKey) {
  parentObject[toKey] = parentObject[fromKey]
  delete parentObject[fromKey]
}

function transformYaml (packageDir, yamlData, userSupplied) {
  return defaultArgsFromApp(packageDir)
    .then(packageJSONArgs => {
      merge(yamlData, packageJSONArgs, userSupplied)
      renameYamlSubtree(yamlData.parts, 'electronApp', yamlData.name)
      renameYamlSubtree(yamlData.apps, 'electronApp', yamlData.name)
      yamlData.apps[yamlData.name].command = `desktop-launch '$SNAP/${yamlData.name}'`

      return yamlData
    })
}

function writeYaml (filename, data) {
  return fs.outputFile(filename, yaml.safeDump(data))
}

function createYamlFromTemplate (packageDir, userSupplied) {
  const templateFilename = path.resolve(__dirname, '..', 'resources', 'snapcraft.yaml')
  delete userSupplied.snapcraft

  return readYaml(templateFilename)
    .then(yamlData => transformYaml(packageDir, yamlData, userSupplied))
    .then(yamlData => writeYaml(path.join(packageDir, 'snap', 'snapcraft.yaml'), yamlData))
}

module.exports = createYamlFromTemplate
