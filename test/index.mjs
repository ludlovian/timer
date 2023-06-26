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
  assert.is(t.repeats, true, 'timer is an interval')
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

test('.due & .left', async () => {
  let d = new Date(Date.now() + 100)

  const t = Timer.every(500)
  let left = t.left()
  assert.is(t.due, null)
  assert.is(left, 0)

  t.set({ at: d })
  left = t.left()
  assert.is(t.due, d)
  assert.ok(left > 0 && left <= 100)

  d = new Date(Date.now() - 100)
  t.at(d)
  left = t.left()
  assert.is(t.due, d)
  assert.is(left, 0)

  t.cancel()
})

test('.set ', async () => {
  const t = new Timer()
  let fired = false
  t.set({ fn: () => (fired = true), after: 50 })

  await delay(100)

  assert.is(fired, true, 'timer has fired')

  fired = false
  t.set({ every: 40 })
  assert.is(t.repeats, true, 'timer is an interval')

  await delay(50)

  assert.is(fired, true, 'timer has fired')
  assert.is(t.active, true, 'timer still going')

  t.cancel()
  assert.is(t.active, false, 'timer has stopped')
})

test('chaining', () => {
  const fn = () => null
  const t = new Timer()
  const t2 = t
    .set({ after: 100, fn })
    .fire()
    .cancel()
  assert.is(t, t2)
})

test('re-arm in fire function', async () => {
  const tm = new Timer()
  let called = false

  assert.is(tm.active, false)

  tm.set({
    after: 30,
    fn: () => {
      called = true
      tm.after(30)
    }
  })

  assert.is(tm.active, true, 'timer is initially armed')

  await delay(40)

  assert.is(called, true, 'timer has called')
  assert.is(tm.active, true, 'timer has rearmed')

  tm.cancel()
})

test.run()
