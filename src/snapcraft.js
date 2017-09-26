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

const debug = require('debug')('electron-installer-snap:snapcraft')
const pify = require('pify')
const spawn = require('cross-spawn-promise')
const which = require('which')

class Snapcraft {
  ensureInstalled (snapcraftPath) {
    const cmd = snapcraftPath || 'snapcraft'
    return pify(which)(cmd)
      .then(cmdPath => {
        this.snapcraftPath = cmdPath
        return true
      }).catch(err => {
        throw new Error(
          `Cannot locate ${cmd} in your system. Either install snapcraft, or specify the ` +
          `absolute path to snapcraft in the options. Details:\n${err}`
        )
      })
  }

  run (packageDir, command) {
    debug(`Running '${this.snapcraftPath} ${command}' in ${packageDir}`)
    return spawn(this.snapcraftPath, [command])
      .catch(error => {
        let output = ''
        if (error.stdout) output += error.stdout.toString()
        if (error.stderr) output += error.stderr.toString()
        console.error(`Snapcraft failed (${error.exitStatus}):\n${output}`)
        throw error
      })
  }
}

module.exports = Snapcraft
