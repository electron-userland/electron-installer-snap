'use strict'

const createYamlFromTemplate = require('../src/yaml')
const fs = require('fs-extra')
const path = require('path')
const snap = require('../src')
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

function assertIncludes (t, array, value, message) {
  return t.not(array.indexOf(value), -1, message)
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

test.serial('creates a snap', t =>
  snap({src: path.join(__dirname, 'fixtures', 'app-with-asar')})
    .then(fs.pathExists)
    .then(exists => t.true(exists, 'Snap created'))
)

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
    features: ['audio', 'invalid']
  }
  return createYaml(t, userDefined)
    .then(snapcraftYaml => {
      assertIncludes(t, snapcraftYaml.parts.electronAppName['stage-packages'], 'libpulse0', 'libpulse0 is in stage-packages')
      return assertIncludes(t, snapcraftYaml.apps.electronAppName.plugs, 'pulseaudio', 'pulseaudio is in app plugs')
    })
})

test('desktop-launch command uses productName by default', t => {
  const command = createDesktopLaunchCommand({name: 'app-name', productName: 'App Name'})
  t.true(command.endsWith("/App Name'"), 'Command uses exe-name')
})

test('desktop-launch command uses executableName if specified', t => {
  const command = createDesktopLaunchCommand({name: 'app-name', productName: 'App Name', executableName: 'exe-name'})
  t.true(command.endsWith("/exe-name'"), 'Command uses exe-name')
})
