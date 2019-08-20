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

const copyHooks = require('../src/hooks')
const fs = require('fs-extra')
const path = require('path')
const test = require('ava')

require('./_util')

test('copyHooks fails with an invalid script', t => { return t.throwsAsync(copyHooks(t.context.tempDir.name, { hookScripts: { install: '/does/not/exist' } }), /Hook install at .* does not exist/) }
)

test('copyHooks installs a hook script', async t => {
  const config = { hookScripts: { install: path.join(__dirname, 'fixtures', 'install-hook') } }
  const snapHookPath = path.join(t.context.tempDir.name, 'install')
  await copyHooks(t.context.tempDir.name, config)
  t.is(typeof config.hookScripts, 'undefined', 'hookScripts removed from config')
  try {
    await fs.access(snapHookPath, fs.constants.X_OK)
  } catch (err) {
    t.fail(`Could not access ${snapHookPath}: ${err}`)
  }
})
