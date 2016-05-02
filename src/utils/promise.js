function promise() {
  this.sent = false
  this.error = false
  this.data = undefined
  this.meta = undefined
  this.callback = undefined

  this.send = function(error, data, meta) {
    this.error = error
    this.data = data
    this.sent = true

    if (meta) {
      this.meta = meta
    }

    if (typeof this.callback !== 'undefined') {
      this.callback(error, data, meta)
    }
  }

  this.then = function(new_callback) {
    this.callback = new_callback
    if (this.sent == true) {
      this.callback(this.error, this.data, this.meta);
    }
  }

  return this
}

module.exports = promise
