import test from 'node:test'
import assert from 'node:assert/strict'
import { setTimeout as delay } from 'node:timers/promises'

import Timer from '../src/index.mjs'

function isClose (a, b, tolerance = 2) {
  return Math.abs(b - a) <= tolerance
}

test('Timer', async t => {
  t.test('basic construction', t => {
    const fn = () => {}
    const ms = 100

    const tm = new Timer({ fn, ms })

    assert.ok(tm instanceof Timer, 'object created is instance of Timer')
    assert.strictEqual(tm.fn, fn, 'function is set correctly')
    assert.strictEqual(tm.ms, ms, 'ms is set correctly')
    assert.strictEqual(tm.repeat, false, 'repeat is set correctly')
    assert.strictEqual(tm.active, true, 'timer is started')

    tm.cancel()
  })

  await t.test('Fire after a time', async t => {
    const fn = t.mock.fn()

    const tm = new Timer({ ms: 30, fn })

    assert.strictEqual(fn.mock.callCount(), 0, 'Not initially called')
    assert.strictEqual(tm.active, true, 'timer is started')
    assert.ok(tm.started instanceof Date, 'started time is a Date')
    assert.ok(isClose(+tm.started, Date.now()), 'started time is right')
    assert.ok(tm.due instanceof Date, 'due time is a Date')
    assert.ok(isClose(+tm.due, Date.now() + tm.ms), 'due time is right')

    await delay(50)

    assert.strictEqual(fn.mock.callCount(), 1, 'Timer has been fired')
    assert.strictEqual(tm.active, false, 'timer is no longer active')
    assert.strictEqual(tm.started, undefined, 'started time is cleared')
    assert.strictEqual(tm.due, undefined, 'due time is cleared')
  })

  t.test('Legacy construction', t => {
    const fn = t.mock.fn()

    let tm = new Timer({ after: 30, fn })

    assert.strictEqual(tm.ms, 30, 'ms has been set correctly')
    assert.strictEqual(tm.repeat, false, 'repeat has been set correctly')

    tm.cancel()

    tm = new Timer({ every: 35, fn })

    assert.strictEqual(tm.ms, 35, 'ms has been set correctly')
    assert.strictEqual(tm.repeat, true, 'repeat has been set correctly')

    tm.cancel()
  })

  await t.test('Repeat timer', async t => {
    const fn = t.mock.fn()

    const tm = new Timer({ ms: 30, repeat: true, fn })

    assert.strictEqual(tm.repeat, true, 'repeat set to true')
    assert.strictEqual(fn.mock.callCount(), 0, 'no initial call')

    await delay(75)

    assert.strictEqual(fn.mock.callCount(), 2, 'two calls made')
    assert.strictEqual(tm.active, true, 'timer is still active')
    assert.ok(Date.now() - tm.started < 30, 'started date has been updated')
    assert.ok(+tm.due > Date.now(), 'due date is still in future')

    tm.cancel()

    assert.strictEqual(tm.active, false, 'timer is no longer active')
  })

  await t.test('Cancel after starting', async t => {
    const fn = t.mock.fn()

    const tm = new Timer({ ms: 30, fn })
    await delay(10)

    assert.strictEqual(fn.mock.callCount(), 0, 'no call made yet')
    assert.strictEqual(tm.active, true, 'timer is active')

    tm.cancel()

    assert.strictEqual(tm.active, false, 'timer is not active')

    await delay(30)
    assert.strictEqual(fn.mock.callCount(), 0, 'no call made iafter cancel')
  })

  await t.test('Refresh after cancel', async t => {
    const fn = t.mock.fn()

    const tm = new Timer({ ms: 30, fn })

    await delay(10)
    tm.cancel()

    assert.strictEqual(tm.active, false, 'timer is not active')

    tm.refresh()

    assert.strictEqual(fn.mock.callCount(), 0, 'no call made yet')
    assert.strictEqual(tm.active, true, 'timer is active')
    assert.ok(isClose(+tm.started, Date.now()), 'started time captured')

    await delay(45)

    assert.strictEqual(fn.mock.callCount(), 1, 'call made')
    assert.strictEqual(tm.active, false, 'timer is no longer active')
  })

  await t.test('Refresh after firing', async t => {
    const fn = t.mock.fn()

    const tm = new Timer({ ms: 30, fn })

    await delay(45)

    assert.strictEqual(fn.mock.callCount(), 1, 'one call made')
    assert.strictEqual(tm.active, false, 'timer is not active')

    tm.refresh()

    assert.strictEqual(tm.active, true, 'timer is active')
    assert.ok(isClose(+tm.started, Date.now()), 'started time captured')

    await delay(45)

    assert.strictEqual(fn.mock.callCount(), 2, 'second call made')
    assert.strictEqual(tm.active, false, 'timer is no longer active')
  })

  await t.test('cancel in callback', async t => {
    const fn = t.mock.fn(() => tm.cancel())

    const tm = new Timer({ ms: 30, repeat: true, fn })

    assert.strictEqual(tm.active, true, 'timer is active')
    await delay(45)

    assert.strictEqual(fn.mock.callCount(), 1, 'function has been called')
    assert.strictEqual(
      tm.active,
      false,
      'timer has stopped after cancel in callback'
    )
  })

  await t.test('refresh in callback', async t => {
    let shouldRefresh = true
    const fn = t.mock.fn(() => {
      if (shouldRefresh) tm.refresh()
    })

    const tm = new Timer({ ms: 30, repeat: false, fn })
    try {
      assert.strictEqual(tm.active, true, 'timer is initially active')

      await delay(45)

      assert.strictEqual(fn.mock.callCount(), 1, 'function has been called')
      assert.strictEqual(tm.active, true, 'timer is active after refresh')

      shouldRefresh = false

      await delay(30)

      assert.strictEqual(
        fn.mock.callCount(),
        2,
        'function has been called again'
      )
      assert.strictEqual(tm.active, false, 'timer is no longer active')
    } finally {
      tm.cancel()
    }
  })

  t.test('Errors in construction', t => {
    assert.throws(() => new Timer(), Error, 'No configuration provided')

    assert.throws(
      () => new Timer({ ms: 10 }),
      /No function supplied/,
      'Missing function'
    )

    assert.throws(
      () => new Timer({ ms: 10, fn: 'Function' }),
      /No function supplied/,
      'Invalid function'
    )

    assert.throws(
      () => new Timer({ ms: 'blah', fn: () => {} }),
      /Invalid delay period/,
      'Bad delay period'
    )
  })
})

/*
test('.cancel timeout', async () => {
  let fired = false
  const t = Timer.after(50)
    .call(() => (fired = true))
    .cancel()
  await delay(100)
  assert.is(fired, false, 'timer has not fired')
  assert.is(t.active, false, 'timer no longer active')
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
*/
