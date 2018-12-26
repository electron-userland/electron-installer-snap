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

const createYamlFromTemplate = require('../src/yaml')
const fs = require('fs-extra')
const path = require('path')
const test = require('ava')
const util = require('./_util')
const yaml = require('js-yaml')

function createYaml (t, userDefined, electronVersion) {
  const yamlPath = path.join(t.context.tempDir.name, 'snap', 'snapcraft.yaml')
  if (typeof electronVersion === 'undefined') {
    electronVersion = '1.0.0'
  }
  const packageDir = path.join(t.context.tempDir.name, 'my-app')

  return fs.mkdirs(packageDir)
    .then(() => fs.writeFile(path.join(packageDir, 'version'), `v${electronVersion}`))
    .then(() => createYamlFromTemplate(t.context.tempDir.name, packageDir, userDefined))
    .then(() => fs.pathExists(yamlPath))
    .then(exists => {
      t.true(exists, 'snapcraft.yaml exists')
      return fs.readFile(yamlPath)
    }).then(data => yaml.safeLoad(data, { filename: yamlPath }))
}

test('set custom parts on app', t => {
  const newPart = { plugin: 'nil', 'stage-packages': ['foo', 'bar'] }
  const userDefined = {
    name: 'electronAppName',
    parts: { newPart: newPart }
  }
  return createYaml(t, userDefined)
    .then(snapcraftYaml => t.deepEqual(snapcraftYaml.parts.newPart, newPart))
})

test('set feature on app', t => {
  const userDefined = {
    name: 'electronAppName',
    features: {
      'audio': true,
      'invalid': true
    }
  }
  return createYaml(t, userDefined)
    .then(snapcraftYaml => {
      util.assertIncludes(t, snapcraftYaml.parts.electronAppName['stage-packages'], 'libpulse0', 'libpulse0 is in stage-packages')
      return util.assertIncludes(t, snapcraftYaml.apps.electronAppName.plugs, 'pulseaudio', 'pulseaudio is in app plugs')
    })
})

test('setting both audio and alsa prefers alsa', t =>
  createYaml(t, { name: 'electronAppName', features: { 'audio': true, 'alsa': true } })
    .then(snapcraftYaml => {
      util.assertNotIncludes(t, snapcraftYaml.parts.electronAppName['stage-packages'], 'libpulse0', 'libpulse0 is not in stage-packages')
      util.assertNotIncludes(t, snapcraftYaml.apps.electronAppName.plugs, 'pulseaudio', 'pulseaudio is not in app plugs')
      util.assertIncludes(t, snapcraftYaml.parts.electronAppName['stage-packages'], 'libasound2', 'libasound2 is in stage-packages')
      return util.assertIncludes(t, snapcraftYaml.apps.electronAppName.plugs, 'alsa', 'alsa is in app plugs')
    })
)

test('browserSandbox feature', t =>
  createYaml(t, { name: 'electronAppName', features: { 'browserSandbox': true } })
    .then(snapcraftYaml => {
      util.assertNotIncludes(t, snapcraftYaml.apps.electronAppName.plugs, 'browser-support', 'browser-support is not in app plugs')
      util.assertIncludes(t, snapcraftYaml.apps.electronAppName.plugs, 'browser-sandbox', 'browser-sandbox is in app plugs')
      return t.deepEqual(snapcraftYaml.plugs['browser-sandbox'], { interface: 'browser-support', 'allow-sandbox': true }, 'browser-sandbox plug exists')
    })
)

test('browserSandbox feature with custom plugs', t =>
  createYaml(t, { name: 'electronAppName', appPlugs: ['foobar'], features: { 'browserSandbox': true }, plugs: { foobar: { interface: 'dbus', name: 'com.example.foobar' } } })
    .then(snapcraftYaml => {
      util.assertIncludes(t, snapcraftYaml.apps.electronAppName.plugs, 'browser-sandbox', 'browser-sandbox is in app plugs')
      util.assertIncludes(t, snapcraftYaml.apps.electronAppName.plugs, 'foobar', 'foobar is in app plugs')
      t.deepEqual(snapcraftYaml.plugs.foobar, { interface: 'dbus', name: 'com.example.foobar' })
      return t.deepEqual(snapcraftYaml.plugs['browser-sandbox'], { interface: 'browser-support', 'allow-sandbox': true }, 'browser-sandbox plug exists')
    })
)

test('MPRIS feature', t =>
  createYaml(t, { name: 'electronAppName', features: { 'mpris': 'com.example.mpris' } })
    .then(snapcraftYaml => {
      util.assertIncludes(t, snapcraftYaml.apps.electronAppName.slots, 'electronAppName-mpris', 'mpris is in app slots')
      return t.deepEqual(snapcraftYaml.slots['electronAppName-mpris'], { interface: 'mpris', name: 'com.example.mpris' }, 'mpris slot defined')
    })
)

test('custom app slots config', t =>
  createYaml(t, { name: 'electronAppName', appSlots: ['foobar'] })
    .then(snapcraftYaml => util.assertIncludes(t, snapcraftYaml.apps.electronAppName.slots, 'foobar', 'foobar is set in app slots'))
)

test('custom app config', t =>
  createYaml(t, { name: 'electronAppName', appConfig: { daemon: true } })
    .then(snapcraftYaml => t.true(snapcraftYaml.apps.electronAppName.daemon, 'daemon is set in app'))
)

test('Electron < 2 apps use desktop-gtk2', t =>
  createYaml(t, { name: 'electronAppName' }, '1.8.2')
    .then(snapcraftYaml => t.deepEqual(snapcraftYaml.parts.electronAppName.after, ['desktop-gtk2']))
)

test('Electron 2 apps use desktop-gtk3', t =>
  createYaml(t, { name: 'electronAppName' }, '2.0.0-beta.1')
    .then(snapcraftYaml => t.deepEqual(snapcraftYaml.parts.electronAppName.after, ['desktop-gtk3']))
)

test('Electron < 4 apps require gconf', t =>
  createYaml(t, { name: 'electronAppName' }, '1.8.2')
    .then(snapcraftYaml => t.true(snapcraftYaml.parts.electronAppName['stage-packages'].includes('libgconf2-4'), 'Expected libgconf2-4 in stage-packages'))
)

test('Electron 4 apps do not require gconf', t =>
  createYaml(t, { name: 'electronAppName' }, '4.0.0')
    .then(snapcraftYaml => t.false(snapcraftYaml.parts.electronAppName['stage-packages'].includes('libgconf2-4'), 'Expected libgconf2-4 not in stage-packages'))
)
