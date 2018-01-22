'use strict'

const fs = require('fs-extra')
const path = require('path')
const snap = require('../src')
const test = require('ava')
const tmp = require('tmp-promise')

function assertThrows (t, options, messageRegex) {
  return t.throws(snap(options)).catch(err => t.regex(err.message, messageRegex))
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
