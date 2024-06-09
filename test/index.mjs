import { suite, test } from 'node:test'
import assert from 'node:assert/strict'
import { setTimeout as delay } from 'node:timers/promises'

import Timer from '../src/index.mjs'

function isClose (a, b, tolerance = 2) {
  return Math.abs(b - a) <= tolerance
}

suite('Timer', async () => {
  test('basic construction', () => {
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

  test('Fire after a time', async t => {
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

  test('Legacy construction', t => {
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

  test('Repeat timer', async t => {
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

  test('Cancel after starting', async t => {
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

  test('Refresh after cancel', async t => {
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

  test('Refresh after firing', async t => {
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

  test('refresh during timeout wait', async t => {
    const fn = t.mock.fn()

    const tm = new Timer({ ms: 30, fn })

    await delay(15)

    assert.strictEqual(fn.mock.callCount(), 0, 'no calls yet')
    assert.strictEqual(tm.active, true, 'Timer is initially active')

    tm.refresh()

    assert.ok(isClose(+tm.started, Date.now()), 'started has been reset')

    await delay(20)
    assert.strictEqual(fn.mock.callCount(), 0, 'still no calls yet')
    assert.strictEqual(tm.active, true, 'Timer is still active')

    await delay(25)
    assert.strictEqual(fn.mock.callCount(), 1, 'one call made')
    assert.strictEqual(tm.active, false, 'Timer is now inactive')
  })

  test('cancel in callback', async t => {
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

  test('refresh in callback', async t => {
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

  test('Errors in construction', t => {
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

  suite('when', () => {
    test('basic when on timeout', async t => {
      const fn = t.mock.fn()
      const callback = t.mock.fn()
      const tm = new Timer({ ms: 30, fn })

      const p = tm.when
      p.then(callback)

      await delay(5)

      assert.ok(p instanceof Promise, '.when creates a promise')
      assert.strictEqual(callback.mock.callCount(), 0, 'not initially resolved')

      const p1 = tm.when
      assert.strictEqual(p, p1, 'identical promise returned')

      await delay(40)

      assert.strictEqual(
        callback.mock.callCount(),
        1,
        'resolved on timer click'
      )
      callback.mock.resetCalls()

      const p2 = tm.when
      assert.ok(p !== p2, '.when resets to a differnt promise')
      p2.then(callback)

      await delay(5)
      assert.strictEqual(
        callback.mock.callCount(),
        1,
        '...which is already resolved'
      )

      tm.cancel()
    })

    test('when on interval', async t => {
      const fn = t.mock.fn()
      const callback = t.mock.fn()
      const tm = new Timer({ ms: 30, repeat: true, fn })

      const p = tm.when
      p.then(callback)

      await delay(5)

      assert.strictEqual(callback.mock.callCount(), 0, 'not initially resolved')

      await delay(40)
      assert.strictEqual(
        callback.mock.callCount(),
        1,
        'resolved on timer click'
      )
      assert.strictEqual(fn.mock.callCount(), 1, 'one call made')
      callback.mock.resetCalls()

      const p1 = tm.when
      assert.ok(p1 !== p, 'new promise created')
      p1.then(callback)

      await delay(30)
      assert.strictEqual(fn.mock.callCount(), 2, 'two calls made')
      assert.strictEqual(
        callback.mock.callCount(),
        1,
        'resolved on timer click'
      )
      callback.mock.resetCalls()

      tm.cancel()

      const p2 = tm.when
      p2.then(callback)

      await delay(5)
      assert.strictEqual(
        callback.mock.callCount(),
        1,
        'ready resolved when inactive'
      )
    })
  })
})
