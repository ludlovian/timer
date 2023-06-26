export default class Timer {
  //
  // Construction
  //
  static at (date) {
    return new Timer().at(date)
  }

  static after (ms) {
    return new Timer().after(ms)
  }

  static every (ms) {
    return new Timer().every(ms)
  }

  constructor (opts = {}) {
    this._tm = null
    this._due = null // when is timer due, or null if interval
    this.set(opts)
  }

  //
  // Attributes
  //
  get active () {
    return !!this._tm
  }

  get due () {
    return this._due
  }

  get repeats () {
    return this.active && !this._due
  }

  left () {
    if (!this._due) return 0
    const ms = +this._due - Date.now()
    return ms < 0 ? 0 : ms
  }

  get fire () {
    return this._fire.bind(this)
  }

  //
  // Set up & cancel
  //

  at (date) {
    this.cancel()
    const ms = +date - Date.now()
    this._tm = setTimeout(this.fire, ms < 0 ? 0 : ms)
    this._due = date
    return this
  }

  after (ms) {
    return this.at(new Date(Date.now() + ms))
  }

  every (ms) {
    this.cancel()
    this._tm = setInterval(this.fire, ms)
    return this
  }

  cancel () {
    if (this._tm) {
      const clear = this._due ? clearTimeout : clearInterval
      clear(this._tm)
      this._due = null
      this._tm = null
    }
    return this
  }

  call (fn) {
    this.fn = fn
    return this
  }

  _fire () {
    if (this._due) this.cancel()
    if (this.fn) this.fn()
    return this
  }
}

Timer.prototype.set = function set ({ at, after, every, fn }) {
  if (fn) this.fn = fn
  if (at) this.at(at)
  if (after) this.after(after)
  if (every) this.every(every)
  return this
}
