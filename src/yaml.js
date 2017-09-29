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

/**
 * Blank lines need to be dots, like Debian.
 */
function convertBlankLines (text) {
  return text.replace(/^$/m, '.')
}

class SnapcraftYAML {
  read (templateFilename) {
    debug('Loading YAML template', templateFilename)
    return fs.readFile(templateFilename)
      .then(data => {
        this.data = yaml.safeLoad(data, { filename: templateFilename })
        return this.data
      })
  }

  renameSubtree (parentObject, fromKey, toKey) {
    parentObject[toKey] = parentObject[fromKey]
    delete parentObject[fromKey]
  }

  validateSummary () {
    if (this.data.summary.length > 79) {
      throw new Error(`The max length of the summary is 79 characters, you have ${this.data.summary.length}`)
    }
  }

  transform (packageDir, userSupplied) {
    return defaultArgsFromApp(packageDir)
      .then(packageJSONArgs => {
        merge(this.data, packageJSONArgs, userSupplied)
        this.renameSubtree(this.data.parts, 'electronApp', this.data.name)
        this.renameSubtree(this.data.apps, 'electronApp', this.data.name)
        this.data.description = convertBlankLines(this.data.description)
        this.validateSummary()
        this.data.apps[this.data.name].command = `desktop-launch '$SNAP/${this.data.name}/${this.data.productName}'`
        const parts = this.data.parts[this.data.name]
        parts.source = path.dirname(packageDir)
        parts.organize = {}
        parts.organize[path.basename(packageDir)] = this.data.name

        delete this.data.productName

        return this.data
      })
  }

  write (filename) {
    debug('Writing new YAML file', filename)
    return fs.outputFile(filename, yaml.safeDump(this.data))
  }
}

function createYamlFromTemplate (snapDir, packageDir, userSupplied) {
  const templateFilename = path.resolve(__dirname, '..', 'resources', 'snapcraft.yaml')
  delete userSupplied.snapcraft

  const yamlData = new SnapcraftYAML()

  return yamlData.read(templateFilename)
    .then(() => yamlData.transform(packageDir, userSupplied))
    .then(() => yamlData.write(path.join(snapDir, 'snap', 'snapcraft.yaml')))
}

module.exports = createYamlFromTemplate
