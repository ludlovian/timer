# timer
Simple timer handling.

Does nothing more than wrap the standard API but keeps hold of the timeout entity.

## Timer

### Timer.at(datetime) => Timer

Creates a Timer which will fire at a certain date/time

### Timer.from(ms) => Timer

Creates a Timer which will fire in `ms` millisseconds time

### Timer.every(ms) => Timer

Creates a Timer which will fire every `ms` milliseconds

### .call(fn)

Sets the function to be called when it fires. Returns itself for chaining.

### .cancel()

Cancels the timer. Returns itself for chaining. Idempotent.

### .at, .from, .every

Reconfigures the current timer
