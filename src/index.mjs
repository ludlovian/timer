import util from 'node:util'

export default class Timer {
  #tm = null
  #ms = 0
  #fn = undefined
  #active = false
  #repeat = false
  #started = undefined

  constructor (config = {}) {
    // legacy props
    if ('after' in config) {
      config.ms = config.after
      config.repeat = false
    }
    if ('every' in config) {
      config.ms = config.every
      config.repeat = true
    }

    // validation
    this.#ms = +config.ms
    if (this.#ms * 0 !== 0) throw errInvalidDelay()

    this.#repeat = !!config.repeat

    this.#fn = config.fn
    if (typeof this.#fn !== 'function') throw errNoFunctionSupplied()

    const enumerable = true
    const configurable = true
    const defs = {
      ms: { enumerable, configurable, get: () => this.#ms },
      repeat: { enumerable, configurable, get: () => this.#repeat },
      fn: { enumerable, configurable, get: () => this.#fn }
    }
    Object.defineProperties(this, defs)

    this.#start()
  }

  /* c8 ignore start */
  [util.inspect.custom] (depth, options, inspect) {
    if (depth < 0) {
      return options.stylize('[Timer]', 'date')
    }
    return [
      'Timer { ms: ',
      options.stylize(this.ms, 'number'),
      ', repeat: ',
      options.stylize(this.repeat, 'boolean'),
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

  cancel () {
    if (!this.#active) return this
    clearTimeout(this.#tm)
    this.#tm = undefined
    this.#active = false
    return this
  }

  refresh () {
    this.cancel()
    this.#start()
    return this
  }

  #start () {
    this.#started = Date.now()
    this.#active = true
    if (this.#tm) {
      this.#tm.refresh()
    } else {
      this.#tm = setTimeout(this.#fire.bind(this), this.#ms)
    }
  }

  #fire () {
    this.#fn()
    if (this.#repeat) {
      this.#start()
    } else {
      this.#active = false
    }
  }
}

function errNoFunctionSupplied () {
  return new Error('No function supplied to Timer')
}

function errInvalidDelay () {
  return new Error('Invalid delay period supplied to Timer')
}
