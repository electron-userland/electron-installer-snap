'use strict'

const path = require('path')
const snap = require('../src')
const test = require('ava')
const tmp = require('tmp-promise')

test.beforeEach(t => {
  t.context.tempDir = tmp.dirSync({ prefix: 'electron-installer-snap-' })
  process.chdir(t.context.tempDir.name)
})

test.afterEach.always(t => {
  t.context.tempDir.removeCallback()
})

test('missing configuration', t => t.throws(snap, 'Missing configuration'))

test('packaged app not found', t =>
  t.throws(snap({})).catch(err => t.regex(err.message, /^Could not find, read, or parse package\.json/))
)
test.serial('snapcraft fails', t => snap({src: path.join(__dirname, 'fixtures', 'package-stub')}))
