const customInspect = Symbol.for('nodejs.util.inspect.custom')
/* c8 ignore next */
const isBrowser = typeof window !== 'undefined' && !!window?.document
// const isBrowser = true


export default class Timer {
  // Configuration
  #tm = null
  #ms = 0
  #fn = undefined
  #repeat = false

  // State
  #active = false
  #started = undefined
  #when
  #whenResolve

  constructor ({ ms, repeat, fn, after, every }) {
    // legacy props
    if (!ms && after !== undefined) {
      ms = after
      repeat = false
    } else if (!ms && every !== undefined) {
      ms = every
      repeat = true
    }

    // validation
    if (typeof fn !== 'function') throw errNoFunctionSupplied()
    ms = Math.floor(ms)
    if (isNaN(ms)) throw errInvalidDelay()

    this.#fn = fn
    this.#ms = ms
    this.#repeat = !!repeat

    this.#addProperties()
    this.#start()
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
    return this.#active
  }

  get started () {
    return this.#active ? new Date(this.#started) : undefined
  }

  get due () {
    return this.#active ? new Date(this.#started + this.#ms) : undefined
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

  cancel () {
    if (!this.#active) return this
    clearTimeout(this.#tm)
    this.#when = this.#whenResolve = this.#tm = undefined
    this.#active = false
    return this
  }

  refresh () {
    this.#start()
    return this
  }

  #addProperties () {
    const enumerable = true
    const configurable = true
    const defs = {
      ms: { enumerable, configurable, get: () => this.#ms },
      repeat: { enumerable, configurable, get: () => this.#repeat },
      fn: { enumerable, configurable, get: () => this.#fn }
    }
    Object.defineProperties(this, defs)
  }

  #start () {
    this.#started = Date.now()
    /* c8 ignore next */
    if (isBrowser) this.cancel()
    this.#active = true
    if (this.#tm) {
      this.#tm.refresh()
    } else {
      this.#tm = setTimeout(this.#fire.bind(this), this.#ms)
    }
  }

  #fire () {
    // Configuration is all done first, before the callback is called
    // to allow the callback to adjust it
    if (this.#whenResolve) this.#whenResolve()
    this.#whenResolve = this.#when = undefined
    if (this.#repeat) {
      this.#start()
    } else {
      this.#active = false
    }
    this.#fn()
  }
}

function errNoFunctionSupplied () {
  return new Error('No function supplied to Timer')
}

function errInvalidDelay () {
  return new Error('Invalid delay period supplied to Timer')
}
