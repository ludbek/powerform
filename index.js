const {validateSingle, validate, required} = require('validatex')

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

const configSchema = {
  validator: required(true)
}

class Field {
  constructor (config) {
    const error = validate(config || {}, configSchema)
    if (error) throw new Error(JSON.stringify(error))

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

  setData(value) {
    if (this.currentValue === value) return
    this.previousValue = clone(this.currentValue)

    const modifier = this.config.modifier
    this.currentValue = modifier && modifier(clone(value)) || clone(value)

    const callback = this.config.onChange
    callback && callback(clone(value))
  }

  getData() {
    return clone(this.currentValue)
  }

  isValid(attachError) {
    let error = validateSingle(
      this.currentValue,
      this.config.validator,
      false, // multiple error flag
      this.parent && this.parent.getData(),
      this.fieldName
    )
    if (error) {
      if (attachError !== false)  {
        this.setError(error)
      }
      return false
    }
    else {
      this.error = null
      return true
    }
  }

  setError(error) {
    this.error = error
    const callback = this.config.onError
    callback && callback(error)
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
    const decorator = this.config.decorator
    return decorator && decorator(currentValue, previousValue) || currentValue
  }
}

class Form {
  static new(config) {
    const form = new this()
    form._fields = []

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
    for(const prop in data) {
      if (this._fields.indexOf(prop) !== -1) {
        this[prop].setData(data[prop])
      }
    }
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
    for(const field in errors) {
      if(this._fields.indexOf(field) !== -1) {
        this[field].setError(errors[field])
      }
    }
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
    for(const field of this._fields) {
      this[field].makePrestine()
    }
  }

  reset() {
    for(const field of this._fields) {
      this[field].reset()
    }
  }

  isValid(attachError) {
    for(const field of this._fields) {
      if(!this[field].isValid(attachError)) return false
    }
    return true
  }
}

module.exports = {
  Form,
  Field
}
