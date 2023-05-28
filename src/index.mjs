export default class Timer {
  static at (date) {
    return new Timer().at(date)
  }

  static after (ms) {
    return new Timer().after(ms)
  }

  static every (ms) {
    return new Timer().every(ms)
  }

  constructor () {
    this._tm = null
    this._call = null
    this._interval = false
    this._fire = this._fire.bind(this)
  }

  get active () {
    return !!this._tm
  }

  get isInterval () {
    return this._interval
  }

  after (ms) {
    this.cancel()
    this._tm = setTimeout(this._fire, ms)
    this._interval = false
    return this
  }

  at (date) {
    return this.after(Math.max(0, +date - Date.now()))
  }

  every (ms) {
    this.cancel()
    this._tm = setInterval(this._fire, ms)
    this._interval = true
    return this
  }

  call (fn) {
    this._call = fn
    return this
  }

  cancel () {
    if (this._tm) {
      const clear = this._interval ? clearInterval : clearTimeout
      clear(this._tm)
      this._tm = null
    }
    return this
  }

  _fire () {
    if (this._call) this._call()
    if (!this._interval) this._tm = null
  }
}
