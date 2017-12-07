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
    const siblingData = this.getSiblingData && this.getSiblingData()
    let error = this.config.validator(this.currentValue, siblingData)
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
  }

  reset() {
    this.currentValue = clone(this.initialValue)
    this.previousValue = clone(this.initialValue)
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

}

module.exports = {
  Form,
  Field
}
