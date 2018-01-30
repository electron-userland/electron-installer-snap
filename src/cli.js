#!/usr/bin/env node
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

const buildSnap = require('.')
const debug = require('debug')('electron-installer-snap:cli')
const yargs = require('yargs')

function parseArgs () {
  let args = yargs.option('src', {
    describe: 'directory of the packaged Electron app',
    default: process.cwd()
  }).option('dest', {
    describe: 'directory where the snap is written',
    default: process.cwd()
  }).option('snapcraft', {
    describe: 'The absolute path to snapcraft. Defaults to searching in PATH.',
    string: true
  }).option('name', {
    describe: 'name of the snap package (defaults to name in package.json)',
    string: true
  }).option('app-version', {
    describe: 'version of the snap package (defaults to version in package.json)',
    string: true
  }).option('summary', {
    describe: 'A 78 character long summary for the snap (defaults to description in package.json)',
    string: true
  }).option('description', {
    describe: 'The longer description for the snap',
    string: true
  }).option('executable-name', {
    describe: 'The executable name of the Electron app, sans file extension (defaults to productName or name in package.json)',
    string: true
  }).option('feature', {
    describe: 'The functionality to enable with the snap. Valid features are listed in the API docs. Examples: --feature.audio --feature.mpris=com.example.mpris'
  }).option('hook', {
    describe: 'One or more hook types to use with the snap. Example: --hook.install=/path/to/script . For more types, see https://docs.snapcraft.io/build-snaps/hooks'
  }).option('grade', {
    describe: 'The quality grade of the snap',
    string: true
  }).option('confinement', {
    describe: 'See: https://snapcraft.io/docs/reference/confinement',
    string: true
  }).strict()
    .usage('$0\n\nBuilds a Snap for an already customized Electron app.\n' +
           'For more details on Snap-specific arguments, see the snapcraft syntax page:\n' +
           'https://snapcraft.io/docs/build-snaps/syntax')
    .argv

  debug('Original args:', args)

  args.version = args.appVersion
  delete args.appVersion

  if (args.feature) {
    args.features = args.feature
    delete args.feature
  }

  if (args.hook) {
    args.hookScripts = args.hook
    delete args.hook
  }

  const filteredArgs = {}
  const YARGS_KEYS = ['_', '$0', 'help']
  for (const key in args) {
    const value = args[key]
    if (value !== undefined && key.indexOf('-') === -1 && YARGS_KEYS.indexOf(key) === -1) {
      filteredArgs[key] = value
    }
  }

  debug('Filtered args:', filteredArgs)

  return filteredArgs
}

buildSnap(parseArgs())
