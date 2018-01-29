'use strict'

const createYamlFromTemplate = require('../src/yaml')
const fs = require('fs-extra')
const path = require('path')
const snap = require('../src')
const test = require('ava')
const tmp = require('tmp-promise')
const yaml = require('js-yaml')

function assertThrows (t, options, messageRegex) {
  return t.throws(snap(options)).catch(err => t.regex(err.message, messageRegex))
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

test('packaged app not found', t => assertThrows(t, {}, /^Could not find, read, or parse package\.json/))

test('cannot find custom snapcraft', t => assertThrows(t, {snapcraft: '/foo/bar/non-existent'}, /Cannot locate \/foo\/bar\/non-existent in your system/))

test('package description too long', t => assertThrows(t, {}, /The max length of the summary/))

test.serial('creates a snap', t =>
  snap({src: path.join(__dirname, 'fixtures', 'app-with-asar')})
    .then(fs.pathExists)
    .then(exists => t.true(exists, 'Snap created'))
)

test('set custom parts on app', t => {
  const yamlPath = path.join(t.context.tempDir.name, 'snap', 'snapcraft.yaml')
  const newPart = { plugin: 'nil', 'stage-packages': ['foo', 'bar'] }
  const userDefined = {
    name: 'electronAppName',
    parts: { newPart: newPart }
  }
  return createYamlFromTemplate(t.context.tempDir.name, 'my-app', userDefined)
    .then(() => fs.pathExists(yamlPath))
    .then(exists => {
      t.true(exists, 'snapcraft.yaml exists')
      return fs.readFile(yamlPath)
    }).then(data => {
      const deserialized = yaml.safeLoad(data, { filename: yamlPath })
      return t.deepEqual(deserialized.parts.newPart, newPart)
    })
})

test('set feature on app', t => {
  const yamlPath = path.join(t.context.tempDir.name, 'snap', 'snapcraft.yaml')
  const userDefined = {
    name: 'electronAppName',
    features: ['audio', 'invalid']
  }
  return createYamlFromTemplate(t.context.tempDir.name, 'my-app', userDefined)
    .then(() => fs.pathExists(yamlPath))
    .then(exists => {
      t.true(exists, 'snapcraft.yaml exists')
      return fs.readFile(yamlPath)
    }).then(data => {
      const deserialized = yaml.safeLoad(data, { filename: yamlPath })
      assertIncludes(t, deserialized.parts.electronAppName['stage-packages'], 'libpulse0', 'libpulse0 is in stage-packages')
      return assertIncludes(t, deserialized.apps.electronAppName.plugs, 'pulseaudio', 'pulseaudio is in app plugs')
    })
})
