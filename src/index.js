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

const common = require('electron-installer-common')
const debug = require('debug')('electron-installer-snap:index')
const fs = require('fs-extra')
const nodeify = require('nodeify')
const path = require('path')
const tmp = require('tmp-promise')

const Snapcraft = require('./snapcraft')
const createDesktopFile = require('./desktop')
const copyHooks = require('./hooks')
const copyIcon = require('./icon')
const { copyLauncher } = require('./launcher')
const createYamlFromTemplate = require('./yaml')
const defaultArgsFromApp = require('./default_args')
const { updateSandboxHelperPermissions } = require('electron-installer-common')

class SnapCreator {
  prepareOptions (userSupplied) {
    this.packageDir = path.resolve(userSupplied.src || process.cwd())
    delete userSupplied.src

    return defaultArgsFromApp(this.packageDir)
      .then(defaultArgs => this.setOptions(defaultArgs, userSupplied))
  }

  setOptions (defaultArgs, userSupplied) {
    this.config = Object.assign(defaultArgs, userSupplied)
    this.config.name = this.sanitizeName(this.config.name)
    this.snapcraft = new Snapcraft()

    const snapArch = this.snapcraft.translateArch(String(this.config.arch || process.arch))
    const outputDir = path.resolve(this.config.dest || process.cwd())
    delete this.config.dest
    const snapFilename = `${this.config.name}_${this.config.version}_${snapArch}.snap`
    this.snapDestPath = path.join(outputDir, snapFilename)

    this.snapcraftOptions = {
      'target-arch': snapArch,
      output: this.snapDestPath
    }
    delete this.config.arch
  }

  sanitizeName (name) {
    if (name.length > 30) {
      throw new Error(`The max length of the name is 30 characters, you have ${name.length}`)
    }

    const sanitized = common.sanitizeName(name.toLowerCase(), '-a-z0-9')
    if (!/[a-z]/.test(sanitized)) {
      throw new Error('The snap name needs to have at least one letter')
    }

    return sanitized
  }

  runInTempSnapDir () {
    return tmp.dir({ prefix: 'electron-snap-', unsafeCleanup: !debug.enabled })
      .then(tmpdir => {
        this.tmpdir = tmpdir
        return this.prepareAndBuildSnap(tmpdir.path)
      }).catch(err => {
        /* istanbul ignore if */
        if (!debug.enabled) {
          this.tmpdir.cleanup()
        }
        throw err
      })
  }

  prepareAndBuildSnap (snapDir) {
    const snapMetaDir = path.join(snapDir, 'snap')
    const snapGuiDir = path.join(snapMetaDir, 'gui')
    return fs.ensureDir(snapGuiDir)
      .then(() => updateSandboxHelperPermissions(this.packageDir))
      .then(() => createDesktopFile(snapGuiDir, this.config))
      .then(() => copyIcon(snapGuiDir, this.config))
      .then(() => copyLauncher(snapDir, this.config))
      .then(() => createYamlFromTemplate(snapDir, this.packageDir, this.config))
      .then(() => copyHooks(snapMetaDir, this.config))
      .then(() => this.snapcraft.run(snapDir, 'snap', this.snapcraftOptions))
      .then(() => this.snapDestPath)
  }

  create () {
    return this.snapcraft.ensureInstalled(this.config.snapcraft)
      .then(() => this.runInTempSnapDir())
  }
}

function createSnap (userSupplied) {
  if (!userSupplied) {
    throw new Error('Missing configuration')
  }

  const creator = new SnapCreator()
  return creator.prepareOptions(userSupplied)
    .then(() => creator.create())
}

module.exports = nodeify(createSnap)
module.exports.SnapCreator = SnapCreator
