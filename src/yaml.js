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

const debug = require('debug')('electron-installer-snap:yaml')
const common = require('electron-installer-common')
const fs = require('fs-extra')
const { merge, pull } = require('lodash')
const path = require('path')
const { spawn } = require('@malept/cross-spawn-promise')
const which = require('which')
const yaml = require('js-yaml')

const { createDesktopLaunchCommand } = require('./launcher')

const DEPENDENCY_MAP = {
  atspi: 'libatspi2.0-0',
  drm: 'libdrm2',
  gbm: 'libgbm1',
  gconf: 'libgconf-2-4',
  gtk2: 'desktop-gtk2',
  gtk3: 'desktop-gtk3',
  uuid: 'libuuid1',
  xcbDri3: 'libxcb-dri3-0'
}

const FEATURES = {
  audio: {
    packages: ['pulseaudio'],
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
  async read (templateFilename) {
    debug('Loading YAML template', templateFilename)
    this.data = yaml.safeLoad(await fs.readFile(templateFilename), { filename: templateFilename })
    return this.data
  }

  get app () {
    return this.data.apps[this.appName]
  }

  get parts () {
    return this.data.parts[this.appName]
  }

  async detectBase (lsbRelease) {
    if (!lsbRelease) {
      lsbRelease = 'lsb_release'
    }
    const lsbReleasePath = await this.findLsbRelease(lsbRelease)
    if (!lsbReleasePath) {
      debug('Using base: core18 as recommended by the Snapcraft docs')
      return 'core18'
    }

    const [distro, distroVersion] = await this.detectDistro(lsbReleasePath)
    if (distro === 'Ubuntu' && distroVersion === '16.04') {
      return 'core'
    }

    return 'core18'
  }

  async findLsbRelease (lsbRelease) {
    try {
      return await which(lsbRelease)
    } catch (err) {
      debug(`Error when looking for lsb_release:\n${err}`)
    }
  }

  async detectDistro (lsbRelease) {
    const output = await spawn(lsbRelease, ['--short', '--id', '--release'])
    if (output) {
      return output.trim().split('\n')
    }

    return [null, null]
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
    const featureData = FEATURES[feature]
    if (!featureData) {
      debug(`Feature '${feature}' is not found.`)
      return
    }

    if (feature === 'audio' && this.features.alsa) {
      debug('Features audio and alsa are both selected, preferring alsa.')
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
    debug('Replacing browser-support plug with browser-sandbox')
    if (this.app.plugs.includes('browser-sandbox') ||
       (this.features.browserSandbox && this.features.browserSandbox === true)) {
      pull(this.app.plugs, 'browser-support')
      this.app.plugs.push('browser-sandbox')
      if (!this.data.plugs) {
        this.data.plugs = {}
      }
      this.data.plugs['browser-sandbox'] = {
        'allow-sandbox': true,
        interface: 'browser-support'
      }
      console.warn('The browser-sandbox feature will trigger a manual review in the Snap store.')
    }
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

    return this.updateDependencies()
  }

  updateDependencies () {
    this.parts['stage-packages'] = this.parts['stage-packages']
      .concat(common.getATSPIDepends(this.electronVersion, DEPENDENCY_MAP))
      .concat(common.getDRMDepends(this.electronVersion, DEPENDENCY_MAP))
      .concat(common.getGBMDepends(this.electronVersion, DEPENDENCY_MAP))
      .concat(common.getGConfDepends(this.electronVersion, DEPENDENCY_MAP))
      .concat(common.getUUIDDepends(this.electronVersion, DEPENDENCY_MAP))
      .concat(common.getXcbDri3Depends(this.electronVersion, DEPENDENCY_MAP))

    if (this.data.confinement === 'classic') {
      this.parts.after[0] = common.getGTKDepends(this.electronVersion, DEPENDENCY_MAP)
    }

    return this.data
  }

  async transform (packageDir, userSupplied) {
    this.appName = userSupplied.name
    this.features = merge({}, userSupplied.features || {})
    delete userSupplied.features

    if (!userSupplied.base) {
      // eslint-disable-next-line require-atomic-updates
      userSupplied.base = await this.detectBase(userSupplied.lsbRelease)
      debug('Autodetected base:', userSupplied.base)
    }
    delete userSupplied.lsbRelease

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
    this.electronVersion = await common.readElectronVersion(packageDir)
    this.transformFeatures()
    return this.transformParts(packageDir)
  }

  async write (filename) {
    debug('Writing new YAML file', filename)
    return fs.outputFile(filename, yaml.safeDump(this.data))
  }
}

module.exports = async function createYamlFromTemplate (snapDir, packageDir, userSupplied) {
  const templateFilename = (userSupplied.confinement && userSupplied.confinement === 'classic')
    ? path.resolve(__dirname, '..', 'resources', 'classic', 'snapcraft.yaml')
    : path.resolve(__dirname, '..', 'resources', 'strict', 'snapcraft.yaml')
  delete userSupplied.snapcraft

  const yamlData = new SnapcraftYAML()

  await yamlData.read(templateFilename)
  await yamlData.transform(packageDir, userSupplied)
  await yamlData.write(path.join(snapDir, 'snap', 'snapcraft.yaml'))
}

module.exports.SnapcraftYAML = SnapcraftYAML
