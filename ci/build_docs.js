'use strict'

const { Application } = require('typedoc')

const config = {
  excludeExternals: true,
  excludePrivate: true,
  excludeProtected: true,
  includeDeclarations: true,
  mode: 'file'
}

const replaceRef = /^refs\/(head|tag)s\//

function gitRevisionFromGitHubRef () {
  const githubRef = process.env.GITHUB_REF
  if (githubRef) {
    return githubRef.replace(replaceRef, '')
  }
}

const gitRevision = process.argv[2] || gitRevisionFromGitHubRef()
if (gitRevision) {
  if (/^[0-9a-f]+$/i.test(gitRevision)) {
    config.gitRevision = gitRevision
  } else if (gitRevision.startsWith('v')) {
    config.includeVersion = true
  }
}

const app = new Application()
app.bootstrap(config)

const project = app.convert(['src/index.d.ts'])
if (project) {
  app.generateDocs(project, 'typedoc')
} else {
  console.error('Could not generate API documentation from TypeScript definition!')
  // eslint-disable-next-line no-process-exit
  process.exit(1)
}
