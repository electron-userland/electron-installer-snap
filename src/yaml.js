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

const debug = require('debug')('electron-installer-snap:yaml')
const fs = require('fs-extra')
const merge = require('lodash/merge')
const path = require('path')
const yaml = require('js-yaml')

const defaultArgsFromApp = require('./default_args')


function readYaml (filename) {
  return fs.readFile(filename)
    .then(data => yaml.safeLoad(data, { filename: filename }))
}

function renameYamlSubtree (parentObject, fromKey, toKey) {
  parentObject[toKey] = parentObject[fromKey]
  delete parentObject[fromKey]
}

/**
 * Blank lines need to be dots, like Debian.
 */
function convertBlankLines (text) {
  return text.replace(/^$/m, '.')
}

function transformYaml (packageDir, yamlData, userSupplied) {
  return defaultArgsFromApp(packageDir)
    .then(packageJSONArgs => {
      merge(yamlData, packageJSONArgs, userSupplied)
      renameYamlSubtree(yamlData.parts, 'electronApp', yamlData.name)
      renameYamlSubtree(yamlData.apps, 'electronApp', yamlData.name)
      yamlData.description = convertBlankLines(yamlData.description)
      if (yamlData.summary.length > 79) {
        throw new Error(`The max length of the summary is 79 characters, you have ${yamlData.summary.length}`)
      }
      yamlData.apps[yamlData.name].command = `desktop-launch '$SNAP/${yamlData.name}/${yamlData.productName}'`
      const parts = yamlData.parts[yamlData.name]
      parts.source = path.dirname(packageDir)
      parts.organize = {}
      parts.organize[path.basename(packageDir)] = yamlData.name

      delete yamlData.productName

      return yamlData
    })
}

function writeYaml (filename, data) {
  return fs.outputFile(filename, yaml.safeDump(data))
}

function createYamlFromTemplate (snapDir, packageDir, userSupplied) {
  const templateFilename = path.resolve(__dirname, '..', 'resources', 'snapcraft.yaml')
  delete userSupplied.snapcraft

  return readYaml(templateFilename)
    .then(yamlData => transformYaml(packageDir, yamlData, userSupplied))
    .then(yamlData => writeYaml(path.join(snapDir, 'snap', 'snapcraft.yaml'), yamlData))
}

module.exports = createYamlFromTemplate
