# timer
Simple timer handling.

Does nothing more than wrap the standard API but keeps hold of the timeout entity.

## Timer

### new Timer(config)

Creates and configures a new timer.

`config` should be an object with the following:
- `ms`: the delay after which the function should be called
- `fn`: the function to call
- `repeat`: if truthy, the timer should repeat every `ms`
- `inactive`: if truthy, it only configures without starting

It can also accept the convenience properties:
- `after`: the `ms` value and sets `repeat` to `false`
- `every`: the `ms` value and sets `repeat` to `true`
- `at`: sets the `ms` to fire at the given time, with `repeat` set to false

### .set(config)
Reconfigures the timer with new settings in the same way as `new Timer`

Any active timer is cancelled.

### .ms => Number

Enumerable & read only. The current millisecond setting

### .fn => Function

Enumerable & read only. The current function to call

### .repeat

Enumerable & read only. The current `repeat` setting

### .cancel() => Timer

Cancels the timer. Returns itself for chaining. Idempotent.

### .refresh() => Timer

Restarts the timer. Returns itself

### .active => Boolean

Is the timer currently active.

### .due => Date

When is the timer next due

### .started => Date

When was the timer last started

### .when => Promise

Returns a promise which will be resolved on the next timer callback.

If the timer is inactive, then you'll simply get a resolved one.
