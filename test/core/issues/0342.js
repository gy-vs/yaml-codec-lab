'use strict'

const { it } = require('node:test')

const assert = require('assert')
const yaml = require('js-yaml')
const simpleArray = ['a', 'b']
const arrayOfSimpleObj = [{ a: 1 }, { b: 2 }]
const arrayOfObj = [{ a: 1, b: 'abc' }, { c: 'def', d: 2 }]

it('space should be added for array, regardless of indent', function () {
  assert.deepStrictEqual(
    yaml.dump(simpleArray, { indent: 1 }),
    '- a\n- b\n'
  )
  assert.deepStrictEqual(
    yaml.dump(simpleArray, { indent: 2 }),
    '- a\n- b\n'
  )
  assert.deepStrictEqual(
    yaml.dump(simpleArray, { indent: 3 }),
    '- a\n- b\n'
  )
  assert.deepStrictEqual(
    yaml.dump(simpleArray, { indent: 4 }),
    '- a\n- b\n'
  )
})

it('array of objects should not wrap at indentation of 2', function () {
  assert.deepStrictEqual(
    yaml.dump(arrayOfSimpleObj, { indent: 2 }),
    '- a: 1\n- b: 2\n'
  )
  assert.deepStrictEqual(
    yaml.dump(arrayOfObj, { indent: 2 }),
    '- a: 1\n  b: abc\n- c: def\n  d: 2\n'
  )
})

it('array of objects should be compact at indentation of 3', function () {
  assert.deepStrictEqual(
    yaml.dump(arrayOfSimpleObj, { indent: 3 }),
    '- a: 1\n- b: 2\n'
  )
  assert.deepStrictEqual(
    yaml.dump(arrayOfObj, { indent: 3 }),
    '- a: 1\n  b: abc\n- c: def\n  d: 2\n'
  )
  // compact output must round-trip
  assert.deepStrictEqual(
    yaml.load(yaml.dump(arrayOfSimpleObj, { indent: 3 })),
    arrayOfSimpleObj
  )
  assert.deepStrictEqual(
    yaml.load(yaml.dump(arrayOfObj, { indent: 3 })),
    arrayOfObj
  )
})

it('array of objects should be compact at indentation of 4', function () {
  assert.deepStrictEqual(
    yaml.dump(arrayOfSimpleObj, { indent: 4 }),
    '- a: 1\n- b: 2\n'
  )
  assert.deepStrictEqual(
    yaml.dump(arrayOfObj, { indent: 4 }),
    '- a: 1\n  b: abc\n- c: def\n  d: 2\n'
  )
  // compact output must round-trip
  assert.deepStrictEqual(
    yaml.load(yaml.dump(arrayOfSimpleObj, { indent: 4 })),
    arrayOfSimpleObj
  )
  assert.deepStrictEqual(
    yaml.load(yaml.dump(arrayOfObj, { indent: 4 })),
    arrayOfObj
  )
})

it('sequences nested in mappings stay compact for indents >= 3', function () {
  const data = { k: [{ a: [1, 2] }] }

  assert.deepStrictEqual(
    yaml.dump(data, { indent: 3 }),
    'k:\n   - a:\n        - 1\n        - 2\n'
  )
  assert.deepStrictEqual(
    yaml.dump(data, { indent: 4 }),
    'k:\n    - a:\n          - 1\n          - 2\n'
  )

  for (const indent of [3, 4, 5, 8]) {
    assert.deepStrictEqual(yaml.load(yaml.dump(data, { indent })), data)
  }
})

it('arrays nested in arrays stay compact for indents >= 3', function () {
  const data = [1, [2, 3], [{ a: 4 }], [[5, 6]]]

  assert.deepStrictEqual(
    yaml.dump(data, { indent: 4 }),
    '- 1\n- - 2\n  - 3\n- - a: 4\n- - - 5\n    - 6\n'
  )

  for (const indent of [2, 3, 4, 5, 8]) {
    assert.deepStrictEqual(yaml.load(yaml.dump(data, { indent })), data)
  }
})

it('compact sequences work together with noArrayIndent for indents >= 3', function () {
  const data = { k: [{ a: [1, [2, 3]] }] }

  assert.deepStrictEqual(
    yaml.dump(data, { indent: 4, noArrayIndent: true }),
    'k:\n- a:\n  - 1\n  - - 2\n    - 3\n'
  )

  for (const indent of [2, 3, 4, 5]) {
    assert.deepStrictEqual(
      yaml.load(yaml.dump(data, { indent, noArrayIndent: true })),
      data
    )
  }
})

it('compact sequences work together with flowLevel and sortKeys for indents >= 3', function () {
  const data = { z: [{ b: 1, a: [2, 3] }], a: 4 }

  assert.deepStrictEqual(
    yaml.dump(data, { indent: 4, flowLevel: 3, sortKeys: true }),
    'a: 4\nz:\n    - a: [2, 3]\n      b: 1\n'
  )
  assert.deepStrictEqual(
    yaml.dump(data, { indent: 4, flowLevel: 2, sortKeys: true }),
    'a: 4\nz:\n    - {b: 1, a: [2, 3]}\n'
  )

  for (const indent of [2, 3, 4, 6]) {
    for (const flowLevel of [-1, 0, 1, 2, 3]) {
      assert.deepStrictEqual(
        yaml.load(yaml.dump(data, { indent, flowLevel, sortKeys: true })),
        data
      )
    }
  }
})

it('multiline scalars inside compact sequence items round-trip', function () {
  const data = [{ s: 'a\nb' }, { t: '\n  leading' }, { u: 'word. '.repeat(31) }]

  for (const indent of [2, 3, 4, 8, 10]) {
    assert.deepStrictEqual(yaml.load(yaml.dump(data, { indent })), data)
  }
})
