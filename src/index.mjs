const customInspect = Symbol.for('nodejs.util.inspect.custom')

function doNothing () {}

export default class Timer {
  // Configuration
  #tm = null
  #ms = 0
  #fn = undefined
  #repeat = false

  // State
  #started = undefined
  #when
  #whenResolve

  constructor (opts) {
    this.#addProperties()
    this.set(opts)
  }

  ['set'] ({
    fn, //        the function to call
    ms, //        how long until we call
    repeat, //    should we repeat it
    // convenience synonyms
    after, //     one off after X ms
    every, //     repeated every
    at, //        at a certain time
    inactive //   if set, do not start
  } = {}) {
    this.cancel()

    // convenience
    if (ms === undefined && repeat === undefined) {
      if (after !== undefined) {
        ms = after
        repeat = false
      } else if (every !== undefined) {
        ms = every
        repeat = true
      } else if (at !== undefined) {
        ms = Math.max(+at - Date.now(), 0)
        repeat = false
      }
    }

    // null-ish defaults
    fn ??= doNothing
    ms ??= 0
    repeat ??= false
    inactive ??= fn === doNothing

    // validation

    if (typeof fn !== 'function') throw errNoFunctionSupplied()
    ms = Math.floor(ms)
    if (isNaN(ms)) throw errInvalidDelay()

    this.#fn = fn
    this.#ms = ms
    this.#repeat = !!repeat

    if (!inactive) this.#start()
  }

  /* c8 ignore start */
  [customInspect] (depth, opts, inspect) {
    if (depth < 0) {
      return opts.stylize('[Timer]', 'date')
    }
    return [
      'Timer { ',
      `ms: ${opts.stylize(this.ms, 'number')}, `,
      `repeat: ${opts.stylize(this.repeat, 'boolean')}`,
      ' }'
    ].join('')
  }
  /* c8 ignore stop */

  get active () {
    return !!this.#tm
  }

  get started () {
    return this.active ? new Date(this.#started) : undefined
  }

  get due () {
    return this.active ? new Date(this.#started + this.#ms) : undefined
  }

  get when () {
    // if we've got one, return it
    if (this.#when) return this.#when

    // if not active, return a resolved one
    if (!this.active) return Promise.resolve()

    // create a new one and return it
    this.#when = new Promise(resolve => (this.#whenResolve = resolve))
    return this.#when
  }

  #clear () {
    this.#tm = this.#when = this.#whenResolve = undefined
  }

  cancel () {
    if (this.#tm) clearTimeout(this.#tm)
    this.#clear()
    return this
  }

  refresh () {
    this.#start()
    return this
  }

  #addProperties () {
    const enumerable = true
    Object.defineProperties(this, {
      ms: { enumerable, get: () => this.#ms },
      repeat: { enumerable, get: () => this.#repeat },
      fn: { enumerable, get: () => this.#fn }
    })
  }

  #start () {
    this.cancel()
    this.#started = Date.now()
    this.#tm = setTimeout(this.#fire.bind(this), this.#ms)
  }

  #fire () {
    // Configuration is all done first, before the callback is called
    // to allow the callback to adjust it
    if (this.#whenResolve) this.#whenResolve()
    this.#clear()
    if (this.#repeat) this.#start()
    this.#fn()
  }
}

function errNoFunctionSupplied () {
  return new Error('No function supplied to Timer')
}

function errInvalidDelay () {
  return new Error('Invalid delay period supplied to Timer')
}
