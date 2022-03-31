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

const Snapcraft = require('../src/snapcraft')
const test = require('ava')

require('./_util')

test('translate node arches to snap arches', t => {
  const snapcraft = new Snapcraft()
  t.is(snapcraft.translateArch('ia32'), 'i386', '32 bit x86')
  t.is(snapcraft.translateArch('x64'), 'amd64', '64 bit x86')
  t.is(snapcraft.translateArch('armv7l'), 'armhf', 'ARM v7')
  t.is(snapcraft.translateArch('arm'), 'armhf', 'generic ARM')
  t.is(snapcraft.translateArch('arm64'), 'arm64', '64-bit ARM')
})

test('generateArgs flags and options', t => {
  const snapcraft = new Snapcraft()
  const args = snapcraft.generateArgs('nonexistent', { a: 1, b: null }, ['foo', 'bar'])

  t.deepEqual(args, ['nonexistent', '--a=1', '--b', '--destructive-mode', 'foo', 'bar'], 'generated args')
})
