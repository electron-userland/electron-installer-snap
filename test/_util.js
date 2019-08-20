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
const test = require('ava')
const tmp = require('tmp-promise')

function assertIncludes (t, collection, value, message) {
  return t.true(collection.includes(value), message)
}

function assertNotIncludes (t, collection, value, message) {
  return t.false(collection.includes(value), message)
}

test.beforeEach(t => {
  t.context.tempDir = tmp.dirSync({ prefix: 'electron-installer-snap-' })
  process.chdir(t.context.tempDir.name)
})

test.afterEach.always(t => { return fs.remove(t.context.tempDir.name) })

module.exports = {
  assertIncludes: assertIncludes,
  assertNotIncludes: assertNotIncludes
}
