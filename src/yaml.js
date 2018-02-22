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
const merge = require('lodash.merge')
const path = require('path')
const pull = require('lodash.pull')
const semver = require('semver')
const yaml = require('js-yaml')

const createDesktopLaunchCommand = require('./launcher').createDesktopLaunchCommand

const FEATURES = {
  audio: {
    packages: ['libpulse0'],
    plugs: ['pulseaudio']
  },
  alsa: {
    packages: ['libasound2'],
    plugs: ['alsa']
  },
  browserSandbox: {
    transform: 'transformBrowserSandbox'
  },
  mpris: {
    transform: 'transformMPRIS'
  },
  passwords: {
    packages: ['libgnome-keyring0'],
    plugs: ['password-manager-service']
  },
  webgl: {
    packages: ['libgl1-mesa-glx', 'libglu1-mesa'],
    plugs: ['opengl']
  }
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

  get app () {
    return this.data.apps[this.appName]
  }

  get parts () {
    return this.data.parts[this.appName]
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

  transformFeature (feature) {
    let featureData = FEATURES[feature]
    if (!featureData) {
      debug(`Feature '${feature}' is not found.`)
      return
    }

    if (feature === 'audio' && this.features.alsa) {
      debug(`Features audio and alsa are both selected, preferring alsa.`)
      return
    }

    // For aliases
    /* istanbul ignore if */
    if (featureData.feature) {
      return this.transformFeature(featureData.feature)
    }

    if (featureData.transform) {
      this[featureData.transform]()
    } else {
      if (featureData.packages) {
        Array.prototype.push.apply(this.parts['stage-packages'], featureData.packages)
      }
      if (featureData.plugs) {
        Array.prototype.push.apply(this.app.plugs, featureData.plugs)
      }
    }
  }

  transformFeatures () {
    for (const feature of Object.keys(this.features)) {
      this.transformFeature(feature)
    }
  }

  transformBrowserSandbox () {
    debug('Replacing brower-support plug with browser-sandbox')
    pull(this.app.plugs, 'browser-support')
    this.app.plugs.push('browser-sandbox')
    if (!this.data.plugs) {
      this.data.plugs = {}
    }
    this.data.plugs['browser-sandbox'] = {
      'allow-sandbox': true,
      interface: 'browser-support'
    }
    console.warn('This setting will trigger a manual review in the Snap store.')
  }

  transformMPRIS () {
    debug('Adding MPRIS feature')
    const mprisKey = `${this.appName}-mpris`
    if (!this.app.slots) {
      this.app.slots = []
    }
    this.app.slots.push(mprisKey)
    if (!this.data.slots) {
      this.data.slots = {}
    }
    this.data.slots[mprisKey] = {
      interface: 'mpris',
      name: String(this.features.mpris)
    }
  }

  transformParts (packageDir) {
    this.parts.source = path.dirname(packageDir)
    this.parts.organize = {}
    this.parts.organize[path.basename(packageDir)] = this.data.name

    return this.updateGTKDependency(packageDir)
  }

  updateGTKDependency (packageDir) {
    return this.readElectronVersion(packageDir)
      .then(version => {
        if (semver.gte(version, '2.0.0-beta.1')) {
          this.parts.after[0] = 'desktop-gtk3'
        }

        return this.data
      })
  }

  readElectronVersion (packageDir) {
    return fs.readFile(path.resolve(packageDir, 'version'))
      // The content of the version file is the tag name, e.g. "v1.8.1"
      .then(tag => tag.toString().slice(1).trim())
  }

  transform (packageDir, userSupplied) {
    this.appName = userSupplied.name
    this.features = merge({}, userSupplied.features || {})
    delete userSupplied.features

    const appConfig = { apps: { electronApp: userSupplied.appConfig || {} } }
    delete userSupplied.appConfig
    const appPlugsSlots = { apps: { electronApp: {} } }
    if (userSupplied.appPlugs) {
      appPlugsSlots.apps.electronApp.plugs = userSupplied.appPlugs
      delete userSupplied.appPlugs
    }
    if (userSupplied.appSlots) {
      appPlugsSlots.apps.electronApp.slots = userSupplied.appSlots
      delete userSupplied.appSlots
    }

    merge(this.data, userSupplied, appConfig, appPlugsSlots)

    this.renameSubtree(this.data.parts, 'electronApp', this.appName)
    this.renameSubtree(this.data.apps, 'electronApp', this.appName)
    this.validateSummary()
    this.app.command = createDesktopLaunchCommand(this.data)
    this.transformFeatures()
    return this.transformParts(packageDir)
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
