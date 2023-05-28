import { test } from 'uvu'
import * as assert from 'uvu/assert'

import Timer from '../src/index.mjs'

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

test('simple construction', () => {
  const t = Timer.after(100)
  assert.ok(t instanceof Timer, 'instance is created')
})

test('Timer.after', async () => {
  let fired = false
  const t = Timer.after(50).call(() => (fired = true))
  await delay(100)
  assert.is(fired, true, 'timer has fired')
  assert.is(t.active, false, 'timer no longer active')
})

test('Timer.at', async () => {
  let fired = false
  const soon = new Date(Date.now() + 50)
  const t = Timer.at(soon).call(() => (fired = true))

  await delay(100)
  assert.is(fired, true, 'timer has fired')
  assert.is(t.active, false, 'timer no longer active')
})

test('Timer.every', async () => {
  let count = 0
  const t = Timer.every(50).call(() => count++)

  await delay(125)
  assert.is(count, 2, 'timer has fired twice')
  assert.is(t.active, true, 'timer is still going')
  assert.is(t.isInterval, true, 'timer is an interval')
  t.cancel()

  assert.is(t.active, false, 'timer no longer active')
})

test('.cancel timeout', async () => {
  let fired = false
  const t = Timer.after(50)
    .call(() => (fired = true))
    .cancel()
  await delay(100)
  assert.is(fired, false, 'timer has not fired')
  assert.is(t.active, false, 'timer no longer active')
})

test.run()
