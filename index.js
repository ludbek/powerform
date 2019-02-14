function StopValidationError () {
  this.stack = (new Error()).stack
}

function ValidationError (msg) {
  this.message = msg
  this.stack = (new Error(msg)).stack
}


let clone = (data) => {
  if (!data) return data;
  return JSON.parse(JSON.stringify(data));
};

let isEqual = (val1, val2) => {
  return JSON.stringify(val1) === JSON.stringify(val2);
};

class Field {
  constructor (config = {}) {
    this.error = undefined
    this.previousValue = undefined
    this.currentValue = undefined
    this.initialValue = undefined

    this.config = config
    this.defaultValue = this.initialValue = !config || config.default === undefined || config.default === null
      ? undefined
      : clone(config.default)
    // will call onChange callback if exists
    this.setData(this.defaultValue, true)
    this.makePrestine()
  }

  static new (config) {
    return new this(config)
  }

  clean(newVal) {
    return newVal
  }

  modify(newVal, preVal) {
    return newVal
  }

  triggerOnError () {
    const callback = this.config.onError
    callback && callback(clone(this.getError()), this)

    if (this.parent) this.parent.triggerOnError()
  }

  triggerOnChange () {
    const callback = this.config.onChange
    callback && callback(clone(this.currentValue), this)

    this.parent && this.parent.triggerOnChange()
  }

  setData(value, skipTrigger) {
    if (isEqual(this.currentValue, value)) return
    this.previousValue = clone(this.currentValue)

    this.currentValue = this.modify(clone(value), clone(this.previousValue))

    if (skipTrigger) return
    const debounce = this.config.debounce
    if (debounce) {
      this.timer && clearTimeout(this.timer)
      this.timer = setTimeout(
        this.triggerOnChange.bind(this),
        debounce
      )
    }
    else {
      this.triggerOnChange()
    }
  }

  getData() {
    return clone(this.currentValue)
  }

  getCleanData() {
    return this.clean(this.getData())
  }

  isValid(skipAttachError) {
    let error
    try {
      this.validate(
        this.currentValue,
        this.parent && this.parent.getData(),
        this.fieldName
      )
      error = undefined
    }
    catch(err) {
      if(err instanceof ValidationError) {
        error = err.message
      }
      else {
        throw err
      }
    }
    !skipAttachError && this.setError(error)
    return !error
  }

  setError(error, skipTrigger) {
    if (this.error === error) return
    this.error = error || undefined

    if(skipTrigger) return
    this.triggerOnError()
  }

  getError() {
    return this.error
  }

  isDirty() {
    return this.previousValue !== this.currentValue
  }

  makePrestine() {
    this.previousValue = clone(this.currentValue)
    this.initialValue = clone(this.currentValue)
    this.setError(undefined)
  }

  makePristine() {
    this.makePrestine()
  }

  reset() {
    this.setData(clone(this.initialValue))
    this.makePristine()
  }

  setAndValidate(value) {
    this.setData(value)
    this.isValid()
    return this.getError()
  }
}

class Form {
  static new(config = {}) {
    const form = new this()
    form._fields = []
    form.config = config
    form.getNotified = true

    for(const fieldName in form) {
      const field = form[fieldName]
      const index = field.index
      if(field instanceof Field) {
        field.parent = form
        field.fieldName = fieldName

        if (index) {
          form._fields[index] = fieldName
        }
        else {
          form._fields.push(fieldName)
        }
      }
    }

    config.data && form.setData(config.data, true)
    return form
  }

  toggleGetNotified() {
    this.getNotified = !this.getNotified
  }

  setData(data, skipTrigger) {
    this.toggleGetNotified()
    for(const prop in data) {
      if (this._fields.indexOf(prop) !== -1) {
        this[prop].setData(data[prop], skipTrigger)
      }
    }
    this.toggleGetNotified()
    if (skipTrigger) return
    this.triggerOnChange()
  }

  triggerOnChange() {
    const callback = this.config.onChange
    this.getNotified && callback && callback(this.getData(), this)
  }

  triggerOnError() {
    const callback = this.config.onError
    this.getNotified && callback && callback(this.getError(), this)
  }

  getData() {
    return this._fields.reduce((acc, fieldName) => {
      acc[fieldName] = this[fieldName].getCleanData()
      return acc
    }, {})
  }

  getUpdates() {
    return this._fields.reduce((acc, fieldName) => {
      if (this[fieldName].isDirty()) {
        acc[fieldName] = this[fieldName].getData()
      }
      return acc
    }, {})
  }

  setError(errors, skipTrigger) {
    this.toggleGetNotified()
    for(const field in errors) {
      if(this._fields.indexOf(field) !== -1) {
        this[field].setError(errors[field], skipTrigger)
      }
    }
    this.toggleGetNotified()

    if (skipTrigger) return
    this.triggerOnError()
  }

  getError() {
    return this._fields.reduce((acc, fieldName) => {
      acc[fieldName] = this[fieldName].getError()
      return acc
    }, {})
  }

  isDirty() {
    for(const field of this._fields) {
      if(this[field].isDirty()) return true
    }
    return false
  }

  makePrestine() {
    this.toggleGetNotified()
    this._fields.forEach((field) => {
      this[field].makePrestine()
    })
    this.toggleGetNotified()
    this.triggerOnError()
  }

  makePristine() {
    this.makePrestine()
  }

  reset() {
    this.toggleGetNotified()
    this._fields.forEach((field) => {
      this[field].reset()
    })
    this.toggleGetNotified()
    this.triggerOnError()
    this.triggerOnChange()
  }

  isValid(skipAttachError) {
    let status
    this.toggleGetNotified()

    try {
      status = this._fields.reduce((acc, field) => {
        const validity = this[field].isValid(skipAttachError)
        if (!validity && this.config.stopOnError) {
          throw new StopValidationError()
        }
        return  validity && acc
      }, true)
    }
    catch (err) {
      if (err instanceof StopValidationError) {
        status = false
      }
      else {
        throw err
      }
    }

    this.toggleGetNotified()
    !skipAttachError && this.triggerOnError()
    return status
  }
}

module.exports = {
  Form,
  Field,
  ValidationError
}
