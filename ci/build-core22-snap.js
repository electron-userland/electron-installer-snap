/*
Copyright 2026 Mark Lee and contributors

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

// Builds a core22 snap of the app-with-asar fixture for the non-blocking
// verify-snap-build workflow (host/destructive mode; see that workflow).

import path from 'node:path'
import fs from 'fs-extra'

import createSnap from '../src/index.js'

async function main () {
  const src = path.join(import.meta.dirname, '..', 'test', 'fixtures', 'app-with-asar')
  const dest = path.join(import.meta.dirname, '..', 'dist-snap')
  await fs.mkdirs(dest)

  console.log(`Building a core22 snap from fixture: ${src}`)
  console.log(`Output directory: ${dest}`)

  const snapPath = await createSnap({ src, dest, base: 'core22' })

  if (!snapPath || !(await fs.pathExists(snapPath))) {
    throw new Error(`Expected a snap at ${snapPath}, but none was produced`)
  }

  const { size } = await fs.stat(snapPath)
  console.log(`Built snap: ${snapPath} (${size} bytes)`)
}

main().catch(err => {
  console.error(err)
  // eslint-disable-next-line n/no-process-exit
  process.exit(1)
})
