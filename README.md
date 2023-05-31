# timer
Simple timer handling.

Does nothing more than wrap the standard API but keeps hold of the timeout entity.

## Timer

### new Timer()

Creates a blank, idle timer.

### .at(datetime) => Timer
### Timer.at(datetime) => Timer

Creates or resets the timer to fire at `datetime`

### .after(ms) => Timer
### Timer.after(ms) => Timer

Creates or resets the timer to fire after `ms` millisseconds

### .every(ms) => Timer
### Timer.every(ms) => Timer

Creates or resets the timer to fire every `ms` milliseconds

### .call(fn) => Timer

Sets the function to be called when it fires. Returns itself for chaining.

### .set({ fn, at, after, every }) => Timer

Reconfigure the timer. Obviously `at`, `after` and `every` are mutually exclusive!
Returns itself for chaining.

### .cancel() => Timer

Cancels the timer. Returns itself for chaining. Idempotent.

### .fire()

Manually fire the timer right now.

If it is not a `repeats`, then the underlying timer is cancelled.

### .repeats => Boolean

Is this a repeating `setInterval` timer or a one-off `setTimeout` kind

### .active => Boolean

Is the timer currently active.

### .due => Date

When is the timer due. Set to `null` for `.repeats`

### .left() => ms

How many milliseconds are left until `.due`. Set to `0` if already iun the
past, or a repeater.
