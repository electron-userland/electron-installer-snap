'use strict'
/*
Copyright 2017 Mark Lee and contributors

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

const nodeify = require('nodeify')
const path = require('path')

const Snapcraft = require('./snapcraft')
const createYamlFromTemplate = require('./yaml')

function buildSnap (userSupplied) {
  const packageDir = path.resolve(userSupplied.dir)
  delete userSupplied.dir
  const arch = String(userSupplied.arch)
  delete userSupplied.arch

  const snapcraft = new Snapcraft()

  return snapcraft.ensureInstalled(userSupplied.snapcraft)
    .then(() => createYamlFromTemplate(packageDir, userSupplied))
    .then(() => snapcraft.run(packageDir, 'snap', { 'target-arch': snapcraft.translateArch(arch) }))
}

module.exports = nodeify(buildSnap)
