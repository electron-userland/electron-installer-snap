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

const debug = require('debug')('electron-installer-snap:index')
const nodeify = require('nodeify')
const path = require('path')
const tmp = require('tmp-promise')

const Snapcraft = require('./snapcraft')
const createYamlFromTemplate = require('./yaml')
const defaultArgsFromApp = require('./default_args')


class SnapCreator {
  constructor (userSupplied) {
    this.packageDir = path.resolve(userSupplied.src)
    delete userSupplied.src

    this.config = Object.assign(defaultArgsFromApp(this.packageDir), userSupplied)
    this.snapcraft = new Snapcraft()

    this.options = {
      'target-arch': this.snapcraft.translateArch(String(userSupplied.arch || process.arch))
    }
    delete this.config.arch

    if (userSupplied.dest) {
      this.options.output = String(userSupplied.dest)
      delete this.config.dest
    }
  }

  runInTempSnapDir () {
    return tmp.dir({ prefix: 'electron-snap-', unsafeCleanup: !debug.enabled })
      .then(tmpdir => {
        this.tmpdir = tmpdir
        return this.prepareAndBuildSnap(tmpdir.path)
      }).catch(err => {
        if (!debug.enabled) {
          this.tmpdir.cleanup()
        }
        throw err
      })
  }

  prepareAndBuildSnap (snapDir) {
    return createYamlFromTemplate(snapDir, this.packageDir, this.config)
      .then(() => this.snapcraft.run(snapDir, 'snap', this.options))
  }

  create () {
    return this.snapcraft.ensureInstalled(this.config.snapcraft)
      .then(() => this.runInTempSnapDir())
  }
}

function createSnap (userSupplied) {
  return new SnapCreator(userSupplied).create()
}

module.exports = nodeify(createSnap)
