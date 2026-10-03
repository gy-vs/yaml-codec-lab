'use strict'

const { describe, it } = require('node:test')

const assert = require('assert')
const path = require('path')
const fs = require('fs')
const yaml = require('js-yaml')

const TEST_SCHEMA = require('./support/schema').TEST_SCHEMA

describe('Dumper', function () {
  const samplesDir = path.resolve(__dirname, 'samples-common')

  fs.readdirSync(samplesDir).forEach(function (jsFile) {
    if (path.extname(jsFile) !== '.js') return // continue

    it(path.basename(jsFile, '.js'), function () {
      const sample = require(path.resolve(samplesDir, jsFile))
      const data = typeof sample === 'function' ? sample.expected : sample
      const serialized = yaml.dump(data, { schema: TEST_SCHEMA })
      const deserialized = yaml.load(serialized, { schema: TEST_SCHEMA })

      if (typeof sample === 'function') {
        sample.call(this, deserialized)
      } else {
        assert.deepStrictEqual(deserialized, sample)
      }
    })
  })
})

describe('Dumper compact sequences', function () {
  // Asserts both the exact serialized form and the load/dump round-trip.
  function assertDumpsTo (data, expected, options) {
    const dumped = yaml.dump(data, options)
    assert.strictEqual(dumped, expected)
    assert.deepStrictEqual(yaml.load(dumped), data)
  }

  it('writes object items on the dash line at indent >= 3', function () {
    for (const indent of [3, 4, 6]) {
      assertDumpsTo(
        [{ b: 1, c: 2 }],
        '- b: 1\n  c: 2\n',
        { indent }
      )
    }
  })

  it('keeps continuation lines aligned with the first item line', function () {
    for (const indent of [3, 4]) {
      assertDumpsTo(
        [{ a: 1, b: 'abc' }, { c: 'def', d: 2 }],
        '- a: 1\n  b: abc\n- c: def\n  d: 2\n',
        { indent }
      )
    }
  })

  it('compacts sequences nested in mappings', function () {
    assertDumpsTo(
      { k: [{ b: 1, c: 2 }] },
      'k:\n    - b: 1\n      c: 2\n',
      { indent: 4 }
    )
    assertDumpsTo(
      { k: [{ b: 1, c: 2 }] },
      'k:\n   - b: 1\n     c: 2\n',
      { indent: 3 }
    )
  })

  it('compacts arrays nested in arrays', function () {
    assertDumpsTo(
      [[1, 2], [3]],
      '- - 1\n  - 2\n- - 3\n',
      { indent: 4 }
    )
  })

  it('aligns nested arrays and mappings relative to the dash column', function () {
    assertDumpsTo(
      { k: [{ b: [1, 2], c: 3 }] },
      'k:\n' +
      '    - b:\n' +
      '        - 1\n' +
      '        - 2\n' +
      '      c: 3\n',
      { indent: 4 }
    )
    assertDumpsTo(
      { k: [{ b: [1, 2], c: 3 }] },
      'k:\n' +
      '   - b:\n' +
      '       - 1\n' +
      '       - 2\n' +
      '     c: 3\n',
      { indent: 3 }
    )
  })

  it('round-trips deeply nested structures at every indent >= 3', function () {
    const data = {
      items: [
        { id: 1, tags: ['a', 'b'], nested: [{ z: [true, false, null] }] },
        { id: 2, tags: [], nested: [{ z: [{ deep: [{ deeper: [1, [2, [3]]] }] }] }] }
      ],
      matrix: [[1, 2], [3, 4]],
      text: [{ value: 'line1\nline2\n' }]
    }

    for (let indent = 3; indent <= 8; indent += 1) {
      assert.deepStrictEqual(yaml.load(yaml.dump(data, { indent })), data)
    }
  })

  it('works together with noArrayIndent', function () {
    assertDumpsTo(
      { list: [{ a: 1, b: [1, 2, 3] }] },
      'list:\n' +
      '- a: 1\n' +
      '  b:\n' +
      '    - 1\n' +
      '    - 2\n' +
      '    - 3\n',
      { indent: 4, noArrayIndent: true }
    )
    assertDumpsTo(
      { list: [{ a: 1, b: [1, 2] }] },
      'list:\n' +
      '- a: 1\n' +
      '  b:\n' +
      '   - 1\n' +
      '   - 2\n',
      { indent: 3, noArrayIndent: true }
    )
  })

  it('works together with flowLevel', function () {
    assertDumpsTo(
      { k: [{ b: [1, 2], c: 3 }] },
      'k:\n' +
      '    - {b: [1, 2], c: 3}\n',
      { indent: 4, flowLevel: 2 }
    )
    assertDumpsTo(
      { k: [{ b: [1, 2], c: 3 }] },
      'k:\n' +
      '    - b: [1, 2]\n' +
      '      c: 3\n',
      { indent: 4, flowLevel: 3 }
    )
  })

  it('works together with sortKeys', function () {
    const data = [{ zeta: 1, alpha: [{ gamma: 2, beta: 3 }] }]
    const dumped = yaml.dump(data, { indent: 4, sortKeys: true })
    assert.strictEqual(
      dumped,
      '- alpha:\n' +
      '    - beta: 3\n' +
      '      gamma: 2\n' +
      '  zeta: 1\n'
    )
    assert.deepStrictEqual(yaml.load(dumped), data)
  })

  it('round-trips duplicate references and anchors', function () {
    const shared = { x: 1, y: [1, 2] }
    const data = [shared, [shared], { z: shared }]
    for (const indent of [3, 4, 6]) {
      const dumped = yaml.dump(data, { indent })
      const loaded = yaml.load(dumped)
      assert.deepStrictEqual(loaded, data)
      assert.strictEqual(loaded[0], loaded[1][0])
      assert.strictEqual(loaded[0], loaded[2].z)
    }
  })

  it('does not change output for indent 1 and 2', function () {
    const data = { k: [{ b: [1, 2], c: 3 }] }
    assertDumpsTo(
      data,
      'k:\n' +
      ' -\n' +
      '  b:\n' +
      '   - 1\n' +
      '   - 2\n' +
      '  c: 3\n',
      { indent: 1 }
    )
    assertDumpsTo(
      data,
      'k:\n' +
      '  - b:\n' +
      '      - 1\n' +
      '      - 2\n' +
      '    c: 3\n',
      { indent: 2 }
    )
  })
})
