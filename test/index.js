'use strict'
/*
Copyright 2018, 2019 Mark Lee and contributors

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
const path = require('path')
const snap = require('../src')
const test = require('ava')
const util = require('./_util')

test('missing configuration', t => {
  return t.throwsAsync(snap, 'Missing configuration')
})

test('package description too long', t => {
  return t.throwsAsync(snap({ src: path.join(__dirname, 'fixtures', 'description-too-long') }), /The max length of the summary/)
})

test('packaged app not found', t => {
  return t.throwsAsync(snap({}), /Could not find, read, or parse package\.json/)
})

test('cannot find custom snapcraft', t => {
  return t.throwsAsync(snap({ src: path.join(__dirname, 'fixtures', 'app-with-asar'), snapcraft: '/foo/bar/non-existent' }), /Cannot locate \/foo\/bar\/non-existent in your system/)
})

test('snap name is sanitized', t => {
  const creator = new snap.SnapCreator()
  t.is(creator.sanitizeName('My App'), 'my-app')
})

test('snap name is too long', t => {
  const creator = new snap.SnapCreator()
  t.throws(() => creator.sanitizeName('My super duper long application name'), /The max length of the name/)
})

test('snap name has no letters', t => {
  const creator = new snap.SnapCreator()
  t.throws(() => creator.sanitizeName('0-9'), /needs to have at least one letter/)
})

if (!process.env['FAST_TESTS_ONLY']) {
  test.serial('creates a snap', async t => {
    const snapPath = await snap({ src: path.join(__dirname, 'fixtures', 'app-with-asar') })
    t.truthy(snapPath, 'snap returns a truthy value')
    t.true(await fs.pathExists(snapPath), `Snap created at ${snapPath}`)
  })

  test.serial('creates a snap in a custom output directory', async t => {
    const destDir = path.join(t.context.tempDir.name, 'custom-output-directory')
    await fs.mkdirs(destDir)
    const snapPath = await snap({ src: path.join(__dirname, 'fixtures', 'app-with-asar'), dest: destDir })
    t.truthy(snapPath, 'snap returns a truthy value')
    util.assertIncludes(t, snapPath, 'custom-output-directory', 'path contains custom output directory')
    t.true(await fs.pathExists(snapPath), `Snap created at ${snapPath}`)
  })
}
