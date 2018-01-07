let clone = (data) => {
  if (!data) return data;
  return JSON.parse(JSON.stringify(data));
};

let isEqual = (val1, val2) => {
  return JSON.stringify(val1) === JSON.stringify(val2);
};

class Field {
  constructor (config = {}) {
    this.error = null
    this.previousValue = null
    this.currentValue = null
    this.initialValue = null

    this.config = config
    this.defaultValue = this.initialValue = !config || config.default === undefined || config.default === null
      ? null
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

    if (this.parent) this.parent.triggerOnChange()
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
    const error = this.validate(
      this.currentValue,
      this.parent && this.parent.getData(),
      this.fieldName
    ) || null
    !skipAttachError && this.setError(error)
    return !error
  }

  setError(error, skipTrigger) {
    if (this.error === error) return
    this.error = error || null

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
    this.setError(null)
  }

  reset() {
    this.setData(clone(this.initialValue))
    this.makePrestine()
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
      if(form.hasOwnProperty(fieldName) && field instanceof Field) {
        field.parent = form
        field.fieldName = fieldName
        form._fields.push(fieldName)
      }
    }

    config.data && form.setData(config.data, true)
    return form
  }

  toggleGetNotified() {
    this.getNotified = !this.getNotified
  }

  setData(data, skipTrigger) {
    for(const prop in data) {
      if (this._fields.indexOf(prop) !== -1) {
        this[prop].setData(data[prop], skipTrigger)
      }
    }
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
    for(const field in errors) {
      if(this._fields.indexOf(field) !== -1) {
        this[field].setError(errors[field], skipTrigger)
      }
    }

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
    this.toggleGetNotified()
    const status = this._fields.reduce((acc, field) => {
      return this[field].isValid(skipAttachError) && acc
    }, true)
    this.toggleGetNotified()
    !skipAttachError && this.triggerOnError()
    return status
  }
}

module.exports = {
  Form,
  Field
}
