'use strict'

const { it } = require('node:test')

const assert = require('assert')
const yaml = require('js-yaml')
const simpleArray = ['a', 'b']
const arrayOfSimpleObj = [{ a: 1 }, { b: 2 }]
const arrayOfObj = [{ a: 1, b: 'abc' }, { c: 'def', d: 2 }]

it('space should be added for array, regardless of indent', function () {
  for (const indent of [1, 2, 3, 4]) {
    const dumped = yaml.dump(simpleArray, { indent })
    assert.deepStrictEqual(dumped, '- a\n- b\n')
    assert.deepStrictEqual(yaml.load(dumped), simpleArray)
  }
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
  assert.deepStrictEqual(yaml.load(yaml.dump(arrayOfSimpleObj, { indent: 2 })), arrayOfSimpleObj)
  assert.deepStrictEqual(yaml.load(yaml.dump(arrayOfObj, { indent: 2 })), arrayOfObj)
})

it('array of objects should be compacted at indentation of 3', function () {
  const dumpedSimple = yaml.dump(arrayOfSimpleObj, { indent: 3 })
  const dumped = yaml.dump(arrayOfObj, { indent: 3 })
  assert.deepStrictEqual(dumpedSimple, '- a: 1\n- b: 2\n')
  assert.deepStrictEqual(dumped, '- a: 1\n  b: abc\n- c: def\n  d: 2\n')
  assert.deepStrictEqual(yaml.load(dumpedSimple), arrayOfSimpleObj)
  assert.deepStrictEqual(yaml.load(dumped), arrayOfObj)
})

it('array of objects should be compacted at indentation of 4', function () {
  const dumpedSimple = yaml.dump(arrayOfSimpleObj, { indent: 4 })
  const dumped = yaml.dump(arrayOfObj, { indent: 4 })
  assert.deepStrictEqual(dumpedSimple, '- a: 1\n- b: 2\n')
  assert.deepStrictEqual(dumped, '- a: 1\n  b: abc\n- c: def\n  d: 2\n')
  assert.deepStrictEqual(yaml.load(dumpedSimple), arrayOfSimpleObj)
  assert.deepStrictEqual(yaml.load(dumped), arrayOfObj)
})
