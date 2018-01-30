'use strict'

const copyIcon = require('../src/icon')
const createDesktopFile = require('../src/desktop')
const createYamlFromTemplate = require('../src/yaml')
const fs = require('fs-extra')
const path = require('path')
const snap = require('../src')
const Snapcraft = require('../src/snapcraft')
const test = require('ava')
const tmp = require('tmp-promise')
const yaml = require('js-yaml')

const createDesktopLaunchCommand = createYamlFromTemplate.createDesktopLaunchCommand

function createYaml (t, userDefined) {
  const yamlPath = path.join(t.context.tempDir.name, 'snap', 'snapcraft.yaml')

  return createYamlFromTemplate(t.context.tempDir.name, 'my-app', userDefined)
    .then(() => fs.pathExists(yamlPath))
    .then(exists => {
      t.true(exists, 'snapcraft.yaml exists')
      return fs.readFile(yamlPath)
    }).then(data => yaml.safeLoad(data, { filename: yamlPath }))
}

function assertIncludes (t, collection, value, message) {
  return t.not(collection.indexOf(value), -1, message)
}

function assertNotIncludes (t, collection, value, message) {
  return t.is(collection.indexOf(value), -1, message)
}

test.beforeEach(t => {
  t.context.tempDir = tmp.dirSync({ prefix: 'electron-installer-snap-' })
  process.chdir(t.context.tempDir.name)
})

test.afterEach.always(t => fs.remove(t.context.tempDir.name))

test('missing configuration', t => t.throws(snap, 'Missing configuration'))

test('packaged app not found', t => t.throws(snap({}), /Could not find, read, or parse package\.json/))

test('cannot find custom snapcraft', t => t.throws(snap({src: path.join(__dirname, 'fixtures', 'app-with-asar'), snapcraft: '/foo/bar/non-existent'}), /Cannot locate \/foo\/bar\/non-existent in your system/))

test('package description too long', t => t.throws(snap({src: path.join(__dirname, 'fixtures', 'description-too-long')}), /The max length of the summary/))

test.serial('creates a snap', t => {
  let snapPath
  return snap({src: path.join(__dirname, 'fixtures', 'app-with-asar')})
    .then(path => {
      t.truthy(path, 'snap returns a truthy value')
      snapPath = path
      return fs.pathExists(snapPath)
    }).then(exists => t.true(exists, `Snap created at ${snapPath}`))
})

test.serial('creates a snap in a custom output directory', t => {
  let snapPath
  return snap({src: path.join(__dirname, 'fixtures', 'app-with-asar')})
    .then(path => {
      t.truthy(path, 'snap returns a truthy value')
      snapPath = path
      assertIncludes(t, snapPath, 'custom-output-directory', 'path contains custom output directory')
      return fs.pathExists(snapPath)
    }).then(exists => t.true(exists, `Snap created at ${snapPath}`))
})

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
      assertIncludes(t, snapcraftYaml.parts.electronAppName['stage-packages'], 'libpulse0', 'libpulse0 is in stage-packages')
      return assertIncludes(t, snapcraftYaml.apps.electronAppName.plugs, 'pulseaudio', 'pulseaudio is in app plugs')
    })
})

test('setting both audio and alsa prefers alsa', t =>
  createYaml(t, { name: 'electronAppName', features: { 'audio': true, 'alsa': true } })
    .then(snapcraftYaml => {
      assertNotIncludes(t, snapcraftYaml.parts.electronAppName['stage-packages'], 'libpulse0', 'libpulse0 is not in stage-packages')
      assertNotIncludes(t, snapcraftYaml.apps.electronAppName.plugs, 'pulseaudio', 'pulseaudio is not in app plugs')
      assertIncludes(t, snapcraftYaml.parts.electronAppName['stage-packages'], 'libasound2', 'libasound2 is in stage-packages')
      return assertIncludes(t, snapcraftYaml.apps.electronAppName.plugs, 'alsa', 'alsa is in app plugs')
    })
)

test('browserSandbox feature', t =>
  createYaml(t, { name: 'electronAppName', features: { 'browserSandbox': true } })
    .then(snapcraftYaml => {
      assertIncludes(t, snapcraftYaml.apps.electronAppName.plugs, 'browser-sandbox', 'browser-sandbox is in app plugs')
      return t.deepEqual(snapcraftYaml.plugs['browser-sandbox'], { interface: 'browser-support', 'allow-sandbox': true }, 'browser-sandbox plug exists')
    })
)

test('MPRIS feature', t =>
  createYaml(t, { name: 'electronAppName', features: { 'mpris': 'com.example.mpris' } })
    .then(snapcraftYaml => {
      assertIncludes(t, snapcraftYaml.apps.electronAppName.slots, 'electronAppName-mpris', 'mpris is in app slots')
      return t.deepEqual(snapcraftYaml.slots['electronAppName-mpris'], { interface: 'mpris', name: 'com.example.mpris' }, 'mpris slot defined')
    })
)

test('desktop-launch command uses productName by default', t => {
  const command = createDesktopLaunchCommand({name: 'app-name', productName: 'App Name'})
  t.true(command.endsWith("/App Name'"), 'Command uses exe-name')
})

test('desktop-launch command uses executableName if specified', t => {
  const command = createDesktopLaunchCommand({name: 'app-name', productName: 'App Name', executableName: 'exe-name'})
  t.true(command.endsWith("/exe-name'"), 'Command uses exe-name')
})

test('custom desktop template', t => {
  const desktopFilePath = path.join(t.context.tempDir.name, 'app.desktop')
  const desktopTemplatePath = path.join(__dirname, 'fixtures', 'custom.desktop.ejs')
  return createDesktopFile(t.context.tempDir.name, { name: 'app', desktopTemplate: desktopTemplatePath })
    .then(() => fs.pathExists(desktopFilePath))
    .then(exists => {
      t.true(exists, 'desktop file exists')
      return fs.readFile(desktopFilePath)
    }).then(desktopData => assertIncludes(t, desktopData.toString(), 'Comment=Hardcoded comment', 'uses custom template'))
})

test('custom icon', t => {
  const iconPath = path.join(t.context.tempDir.name, 'icon.png')
  return copyIcon(t.context.tempDir.name, { icon: path.join(__dirname, 'fixtures', 'icon.png') })
    .then(() => fs.pathExists(iconPath))
    .then(exists => t.true(exists, 'icon exists'))
})

test('translate node arches to snap arches', t => {
  const snapcraft = new Snapcraft()
  t.is(snapcraft.translateArch('ia32'), 'i386', '32 bit x86')
  t.is(snapcraft.translateArch('x64'), 'amd64', '64 bit x86')
  t.is(snapcraft.translateArch('armv7l'), 'armhf', 'ARM v7')
  t.is(snapcraft.translateArch('arm'), 'armhf', 'generic ARM')
  t.is(snapcraft.translateArch('arm64'), 'arm64', '64-bit ARM')
})
