'use strict'
/*
Copyright 2018 Mark Lee and contributors

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

const fs = require('fs-extra')
const launcher = require('../src/launcher')
const path = require('path')
const test = require('ava')

require('./_util')

test('desktop-launch command uses productName by default', t => {
  const command = launcher.createDesktopLaunchCommand({ name: 'app-name', productName: 'App Name' })
  t.true(command.startsWith('desktop-launch'), 'Command uses desktop-launch')
  t.true(command.endsWith("/App Name'"), 'Command uses exe-name')
})

test('desktop-launch command uses executableName if specified', t => {
  const command = launcher.createDesktopLaunchCommand({ name: 'app-name', productName: 'App Name', executableName: 'exe-name' })
  t.true(command.startsWith('desktop-launch'), 'Command uses desktop-launch')
  t.true(command.endsWith("/exe-name'"), 'Command uses exe-name')
})

test('launcher is classic launcher in classic confinement', t => {
  const command = launcher.createDesktopLaunchCommand({ productName: 'App Name', confinement: 'classic' })
  t.true(command.startsWith('bin/electron-launch'), 'Command uses electron-launch')
})

test('no custom launcher is copied to bin folder in non-classic confinement', t =>
  launcher.copyLauncher(t.context.tempDir.name, { confinement: 'strict' })
    .then(() => fs.pathExists(path.join(t.context.tempDir.name, 'bin', 'electron-launch')))
    .then(exists => t.false(exists, 'launcher does not exist'))
)

test('custom launcher is copied to bin folder in classic confinement', t =>
  launcher.copyLauncher(t.context.tempDir.name, { confinement: 'classic' })
    .then(() => fs.pathExists(path.join(t.context.tempDir.name, 'bin', 'electron-launch')))
    .then(exists => t.true(exists, 'launcher exists'))
)
