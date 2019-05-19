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

const copyIcon = require('../src/icon')
const fs = require('fs-extra')
const path = require('path')
const test = require('ava')

require('./_util')

test('custom icon', async t => {
  const iconPath = path.join(t.context.tempDir.name, 'icon.png')
  await copyIcon(t.context.tempDir.name, { icon: path.join(__dirname, 'fixtures', 'icon.png') })
  t.true(await fs.pathExists(iconPath), 'icon exists')
})
