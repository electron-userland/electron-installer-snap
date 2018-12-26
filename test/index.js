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
const path = require('path')
const snap = require('../src')
const test = require('ava')
const util = require('./_util')

test('missing configuration', t => t.throws(snap, 'Missing configuration'))

test('package description too long', t => t.throws(snap({ src: path.join(__dirname, 'fixtures', 'description-too-long') }), /The max length of the summary/))

test('packaged app not found', t => t.throws(snap({}), /Could not find, read, or parse package\.json/))

test('cannot find custom snapcraft', t => t.throws(snap({ src: path.join(__dirname, 'fixtures', 'app-with-asar'), snapcraft: '/foo/bar/non-existent' }), /Cannot locate \/foo\/bar\/non-existent in your system/))

if (!process.env['FAST_TESTS_ONLY']) {
  test.serial('creates a snap', t => {
    let snapPath
    return snap({ src: path.join(__dirname, 'fixtures', 'app-with-asar') })
      .then(path => {
        t.truthy(path, 'snap returns a truthy value')
        snapPath = path
        return fs.pathExists(snapPath)
      }).then(exists => t.true(exists, `Snap created at ${snapPath}`))
  })

  test.serial('creates a snap in a custom output directory', t => {
    let snapPath
    const destDir = path.join(t.context.tempDir.name, 'custom-output-directory')
    return fs.mkdirs(destDir)
      .then(() => snap({ src: path.join(__dirname, 'fixtures', 'app-with-asar'), dest: destDir }))
      .then(path => {
        t.truthy(path, 'snap returns a truthy value')
        snapPath = path
        util.assertIncludes(t, snapPath, 'custom-output-directory', 'path contains custom output directory')
        return fs.pathExists(snapPath)
      }).then(exists => t.true(exists, `Snap created at ${snapPath}`))
  })
}
