'use strict'
/*
Copyright 2018, 2019, 2020 Mark Lee and contributors

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
const sinon = require('sinon')
const test = require('ava')
const util = require('./_util')
const yaml = require('js-yaml')

const SnapcraftYAML = createYamlFromTemplate.SnapcraftYAML

async function createYaml (t, userDefined, electronVersion) {
  const yamlPath = path.join(t.context.tempDir.name, 'snap', 'snapcraft.yaml')
  if (typeof electronVersion === 'undefined') {
    electronVersion = '1.0.0'
  }
  const packageDir = path.join(t.context.tempDir.name, 'my-app')

  await fs.mkdirs(packageDir)
  await fs.writeFile(path.join(packageDir, 'version'), `v${electronVersion}`)
  await createYamlFromTemplate(t.context.tempDir.name, packageDir, userDefined)
  t.true(await fs.pathExists(yamlPath), 'snapcraft.yaml exists')
  return yaml.safeLoad(await fs.readFile(yamlPath), { filename: yamlPath })
}

function assertStagedPackage (t, yaml, packageName) {
  return t.true(yaml.parts.electronAppName['stage-packages'].includes(packageName), `Expected ${packageName} in stage-packages`)
}

function assertNoStagedPackage (t, yaml, packageName) {
  return t.false(yaml.parts.electronAppName['stage-packages'].includes(packageName), `Expected ${packageName} NOT in stage-packages`)
}

test('set custom parts on app', async t => {
  const newPart = { plugin: 'nil', 'stage-packages': ['foo', 'bar'] }
  const userDefined = {
    name: 'electronAppName',
    parts: { newPart: newPart }
  }
  const snapcraftYaml = await createYaml(t, userDefined)
  t.deepEqual(snapcraftYaml.parts.newPart, newPart)
})

test('set feature on app', async t => {
  const userDefined = {
    name: 'electronAppName',
    features: {
      audio: true,
      invalid: true
    }
  }
  const snapcraftYaml = await createYaml(t, userDefined)
  util.assertIncludes(t, snapcraftYaml.parts.electronAppName['stage-packages'], 'pulseaudio', 'pulseaudio is in stage-packages')
  util.assertIncludes(t, snapcraftYaml.apps.electronAppName.plugs, 'pulseaudio', 'pulseaudio is in app plugs')
})

test('setting both audio and alsa prefers alsa', async t => {
  const { apps, parts } = await createYaml(t, { name: 'electronAppName', features: { audio: true, alsa: true } })
  util.assertNotIncludes(t, parts.electronAppName['stage-packages'], 'pulseaudio', 'pulseaudio is not in stage-packages')
  util.assertNotIncludes(t, apps.electronAppName.plugs, 'pulseaudio', 'pulseaudio is not in app plugs')
  util.assertIncludes(t, parts.electronAppName['stage-packages'], 'libasound2', 'libasound2 is in stage-packages')
  util.assertIncludes(t, apps.electronAppName.plugs, 'alsa', 'alsa is in app plugs')
})

test('browserSandbox feature', async t => {
  const { apps, plugs } = await createYaml(t, { name: 'electronAppName', features: { browserSandbox: true } })
  util.assertNotIncludes(t, apps.electronAppName.plugs, 'browser-support', 'browser-support is not in app plugs')
  util.assertIncludes(t, apps.electronAppName.plugs, 'browser-sandbox', 'browser-sandbox is in app plugs')
  t.deepEqual(plugs['browser-sandbox'], { interface: 'browser-support', 'allow-sandbox': true }, 'browser-sandbox plug exists')
})

test('browserSandbox feature allow both true and false', async t => {
  const { apps } = await createYaml(t, { name: 'electronAppName', features: { browserSandbox: false } })
  util.assertIncludes(t, apps.electronAppName.plugs, 'browser-support', 'browser-support is not in app plugs')
  util.assertNotIncludes(t, apps.electronAppName.plugs, 'browser-sandbox', 'browser-sandbox is in app plugs')
})

test('browserSandbox feature with custom plugs', async t => {
  const { apps, plugs } = await createYaml(t, { name: 'electronAppName', appPlugs: ['foobar'], features: { browserSandbox: true }, plugs: { foobar: { interface: 'dbus', name: 'com.example.foobar' } } })
  util.assertIncludes(t, apps.electronAppName.plugs, 'browser-sandbox', 'browser-sandbox is in app plugs')
  util.assertIncludes(t, apps.electronAppName.plugs, 'foobar', 'foobar is in app plugs')
  t.deepEqual(plugs.foobar, { interface: 'dbus', name: 'com.example.foobar' })
  t.deepEqual(plugs['browser-sandbox'], { interface: 'browser-support', 'allow-sandbox': true }, 'browser-sandbox plug exists')
})

test('MPRIS feature', async t => {
  const { apps, slots } = await createYaml(t, { name: 'electronAppName', features: { mpris: 'com.example.mpris' } })
  util.assertIncludes(t, apps.electronAppName.slots, 'electronAppName-mpris', 'mpris is in app slots')
  t.deepEqual(slots['electronAppName-mpris'], { interface: 'mpris', name: 'com.example.mpris' }, 'mpris slot defined')
})

test('custom app slots config', async t => {
  const { apps } = await createYaml(t, { name: 'electronAppName', appSlots: ['foobar'] })
  util.assertIncludes(t, apps.electronAppName.slots, 'foobar', 'foobar is set in app slots')
})

test('custom app config', async t => {
  const { apps } = await createYaml(t, { name: 'electronAppName', appConfig: { daemon: true } })
  t.true(apps.electronAppName.daemon, 'daemon is set in app')
})

test('Electron < 4 apps require gconf', async t => {
  const snapcraftYaml = await createYaml(t, { name: 'electronAppName' }, '1.8.2')
  assertStagedPackage(t, snapcraftYaml, 'libgconf-2-4')
})

test('Electron 4 apps do not require gconf', async t => {
  const snapcraftYaml = await createYaml(t, { name: 'electronAppName' }, '4.0.0')
  assertNoStagedPackage(t, snapcraftYaml, 'libgconf-2-4')
})

test('Electron < 4 apps do not require uuid', async t => {
  const snapcraftYaml = await createYaml(t, { name: 'electronAppName' }, '1.8.2')
  assertNoStagedPackage(t, snapcraftYaml, 'libuuid1')
})

test('Electron 4 apps require uuid', async t => {
  const snapcraftYaml = await createYaml(t, { name: 'electronAppName' }, '4.0.0')
  assertStagedPackage(t, snapcraftYaml, 'libuuid1')
})

test('Electron < 5 apps do not require atspi', async t => {
  const snapcraftYaml = await createYaml(t, { name: 'electronAppName' }, '4.0.0')
  assertNoStagedPackage(t, snapcraftYaml, 'libatspi2.0-0')
})

test('Electron 5 apps require atspi', async t => {
  const snapcraftYaml = await createYaml(t, { name: 'electronAppName' }, '5.0.0')
  assertStagedPackage(t, snapcraftYaml, 'libatspi2.0-0')
})

test('Electron < 9 apps do not require libdrm', async t => {
  const snapcraftYaml = await createYaml(t, { name: 'electronAppName' }, '8.0.0')
  assertNoStagedPackage(t, snapcraftYaml, 'libdrm2')
})

test('Electron 9 apps require libdrm', async t => {
  const snapcraftYaml = await createYaml(t, { name: 'electronAppName' }, '9.0.0')
  assertStagedPackage(t, snapcraftYaml, 'libdrm2')
})

test('Electron < 9 apps do not require xdb-dri3', async t => {
  const snapcraftYaml = await createYaml(t, { name: 'electronAppName' }, '8.0.0')
  assertNoStagedPackage(t, snapcraftYaml, 'libxcb-dri3-0')
})

test('Electron 9 apps require xcb-dri3', async t => {
  const snapcraftYaml = await createYaml(t, { name: 'electronAppName' }, '9.0.0')
  assertStagedPackage(t, snapcraftYaml, 'libxcb-dri3-0')
})

test('Electron < 9 apps do not require gbm', async t => {
  const snapcraftYaml = await createYaml(t, { name: 'electronAppName' }, '8.0.0')
  assertNoStagedPackage(t, snapcraftYaml, 'libgbm1')
})

test('Electron 9 apps require gbm', async t => {
  const snapcraftYaml = await createYaml(t, { name: 'electronAppName' }, '9.0.0')
  assertStagedPackage(t, snapcraftYaml, 'libgbm1')
})

test('base autodetect defaults to core18 when lsb_release is not found', async t => {
  const snapcraftYaml = await createYaml(t, { name: 'electronAppName', lsbRelease: '/does/not/exist' })
  t.is(snapcraftYaml.base, 'core18')
})

test('base autodetect does not run when it is set by the user', async t => {
  const snapcraftYaml = await createYaml(t, { name: 'electronAppName', base: 'bare' })
  t.is(snapcraftYaml.base, 'bare')
})

test('base autodetect returns core when Ubuntu 16.04 is detected', async t => {
  const yaml = new SnapcraftYAML()
  const lsbRelease = sinon.stub(yaml, 'findLsbRelease')
  lsbRelease.resolves('lsb_release')
  const distro = sinon.stub(yaml, 'detectDistro')
  distro.resolves(['Ubuntu', '16.04'])
  try {
    t.is(await yaml.detectBase(), 'core')
  } finally {
    lsbRelease.restore()
    distro.restore()
  }
})

test('base autodetect returns core18 for non-Ubuntu distros', async t => {
  const yaml = new SnapcraftYAML()
  const lsbRelease = sinon.stub(yaml, 'findLsbRelease')
  lsbRelease.resolves('lsb_release')
  const distro = sinon.stub(yaml, 'detectDistro')
  distro.resolves(['Debian', '10'])
  try {
    t.is(await yaml.detectBase(), 'core18')
  } finally {
    lsbRelease.restore()
    distro.restore()
  }
})

test('distro detection returns nulls if specified lsb_release returns nothing', async t => {
  const yaml = new SnapcraftYAML()
  t.deepEqual(await yaml.detectDistro('true'), [null, null])
})
