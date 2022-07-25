'use strict'
/*
Copyright 2017, 2019 Mark Lee and contributors

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
// const { spawn } = require('child_process');
const path = require('path')
const { spawn } = require('@malept/cross-spawn-promise')
const which = require('which')

class Snapcraft {
  async ensureInstalled (snapcraftPath) {
    const cmd = snapcraftPath || 'snapcraft'
    try {
      this.snapcraftPath = await which(cmd)
      return true
    } catch (err) {
      throw new Error(
        `Cannot locate ${cmd} in your system. Either install snapcraft, or specify the ` +
        `absolute path to snapcraft in the options. Details:\n${err}`
      )
    }
  }

  /**
   * Converts Node-style archs to Snap-compatible archs.
   */
  translateArch (arch) {
    switch (arch) {
      case 'ia32': return 'i386'
      case 'x64': return 'amd64'
      case 'armv7l':
      case 'arm':
        return 'armhf'
      // arm64 => arm64
      default: return arch
    }
  }

  /**
   * Generate arguments to pass to snapcraft.
   */
  generateArgs (command, options, extraArgs) {
    const args = [command]
    for (const flag in options) {
      const value = options[flag]
      if (flag !== 'target-arch') {
        if (value) {
          args.push(`--${flag}=${value}`)
        } else {
          args.push(`--${flag}`)
        }
      }
    }
    // args.push('--use-lxd')
    // args.push('--provider:host')
    /* istanbul ignore if */
    // if (debug.enabled) {
    args.push('--debug')
    // args.push('--destructive-mode')
    // }

    if (extraArgs) {
      Array.prototype.push.apply(args, extraArgs)
    }

    return args
  }

  generateSpawnOptions (packageDir) {
    const spawnOptions = {
      cwd: packageDir,
      env: {
        ...process.env,
        SNAPCRAFT_SETUP_CORE: 1,
        LC_ALL: 'C.UTF-8',
        LOCALE: 'C.UTF-8'
        // PATH: process.env.PATH
      },
      stdio: ['ignore', 'ignore', process.stderr]
    }
    /* istanbul ignore if */
    if (debug.enabled) {
      spawnOptions.stdio = 'inherit'
    }

    return spawnOptions
  }

  async run (packageDir, command, options) {
    const args = this.generateArgs(command, options)
    console.log(`Running '${this.snapcraftPath} ${args.join(' ')}' in ${packageDir}`)
    console.log('Spawn Options: ', this.generateSpawnOptions(packageDir))
    try {
      // await this.createSnapPackage(packageDir)
      return spawn('snapcraft', args, this.generateSpawnOptions(packageDir))
      // return spawn(this.snapcraftPath, args, this.generateSpawnOptions(packageDir))
    } catch (error) /* istanbul ignore next */ {
      console.error(`Snapcraft failed (${error.exitStatus})`)
      if (!debug.enabled) {
        console.error('Re-run with the environment variable DEBUG=electron-installer-snap:snapcraft for details.')
      }
      throw error
    }
  }

  async createSnapPackage (packageDir) {
    let result = null

    // const snapFile = `${this.values.executableName}-${this.values.version}.snap`;
    const snapFile = 'footest_0.0.1_amd64.snap'
    console.log(`Snap file artifact name will be: ${snapFile}`)

    // const pathToSnapFile = path.join(this.options.makeOptions.makeDir, 'snapcraft', snapFile);
    const pathToSnapFile = path.join(packageDir, snapFile)
    console.log(`Snap file will be created at: ${pathToSnapFile}`)

    try {
      result = await new Promise((resolve, reject) => {
        const spawnSnapcraftInDirectory = packageDir

        const snapcraft = spawn('snapcraft', ['snap', '--output', snapFile], {
          cwd: spawnSnapcraftInDirectory
        })

        console.log(`Snapcraft is now running with: snapcraft snap --output ${snapFile}`)
        console.log(`Snapcraft has been spawned within the directory: ${spawnSnapcraftInDirectory}`)

        snapcraft.on('close', code => {
          console.log(`Snapcraft has finished running, with a status code of: ${code}`)

          if (code === 0) {
            resolve(code)
            return
          }

          reject(new Error(`Snapcraft exited with a non-zero status code of: ${code}`))
        })

        snapcraft.on('error', error => {
          console.log(`Snapcraft has encountered an error and is aborting: ${error}`)

          reject(error)
        })

        snapcraft.stdout.on('data', data => {
          console.log(`Snapcraft stdout: ${data.toString()}`)
        })
      })
    } catch (error) {
      console.log('Snapcraft ERROR: ', error)

      throw error
    }

    console.log(`Snapcraft finished with status code: ${result}`)
    console.log(`Snapcraft file generated to: ${pathToSnapFile}`)

    return pathToSnapFile
  }
}

module.exports = Snapcraft
