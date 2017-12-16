let isFunction = (data) => {
  return typeof data === "function";
};

let isArray = (data) => {
  return data instanceof Array;
};

let isValidValidator = (validator) => {
  return isFunction(validator) || isArray(validator);
};

let clone = (data) => {
  if (!data) return data;
  return JSON.parse(JSON.stringify(data));
};

let isequal = (val1, val2) => {
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
    this.setData(this.defaultValue)
    this.makePrestine()
  }

  static new (config) {
    return new this(config)
  }

  decorate(newVal, preVal) {
    return newVal
  }

  normalize(newVal, preVal) {
    return newVal
  }

  setData(value) {
    if (this.currentValue === value) return
    this.previousValue = clone(this.currentValue)

    this.currentValue = this.normalize(clone(value), clone(this.previousValue))

    const callback = this.config.onChange
    callback && callback(clone(value), this.getError())

    if (this.parent && this.parent.getNotified) this.parent.notifyChange()
  }

  getData() {
    return clone(this.currentValue)
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

  setError(error) {
    if (this.error === error) return
    this.error = error || null
    const callback = this.config.onChange
    callback && callback(this.getData(), error)

    if (this.parent && this.parent.getNotified) this.parent.notifyChange()
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
    this.error = null
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

  getDecorated() {
    const {currentValue, previousValue} = this
    return this.decorate(clone(currentValue), clone(previousValue))
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

    return form
  }

  setData(data) {
    this.toggleNotificationFlag()
    for(const prop in data) {
      if (this._fields.indexOf(prop) !== -1) {
        this[prop].setData(data[prop])
      }
    }
    this.toggleNotificationFlag()
    this.notifyChange()
  }

  notifyChange() {
    const callback = this.config.onChange
    callback && callback(this.getData(), this.getError())
  }

  getData() {
    return this._fields.reduce((acc, fieldName) => {
      acc[fieldName] = this[fieldName].getData()
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

  setError(errors) {
    this.toggleNotificationFlag()
    for(const field in errors) {
      if(this._fields.indexOf(field) !== -1) {
        this[field].setError(errors[field])
      }
    }
    this.toggleNotificationFlag()
    this.notifyChange()
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
    this._fields.forEach((field) => {
      this[field].makePrestine()
    })
  }

  reset() {
    this._fields.forEach((field) => {
      this[field].reset()
    })
  }

  isValid(skipAttachError) {
    this.toggleNotificationFlag()
    const status = this._fields.reduce((acc, field) => {
      return this[field].isValid(skipAttachError) && acc
    }, true)
    this.toggleNotificationFlag()
    this.notifyChange()
    return status
  }

  toggleNotificationFlag() {
    this.getNotified = !this.getNotified
  }
}

module.exports = {
  Form,
  Field
}
