'use strict'

const snap = require('../src')
const test = require('ava')

test('missing configuration', t => t.throws(snap, 'Missing configuration'))
