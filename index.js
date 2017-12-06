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

    this.config = config
    this.defaultValue = !config || config.default === undefined
      ? null
      : clone(config.default)
    this.currentValue = this.defaultValue
    // will call onChange callback if exists
    this.setData(this.defaultValue)
    this.error = null
  }

  static new (config) {
    return new this(config)
  }

  setData(value) {
    if (this.currentValue === value) return
    this.previousValue = clone(this.currentValue)
    this.currentValue = clone(value)
  }

  getData() {
    return clone(this.currentValue)
  }

  isValid(attachError) {
    let error = this.config.validator(this.currentValue)
    if (error) {
      if (attachError !== false)  {
        this.error = error
      }
      return false
    }
    else {
      this.error = null
      return true
    }
  }

  setError(error) {
    return this.error = error
  }

  getError() {
    return this.error
  }
}

class Form {

}

module.exports = {
  Form,
  Field
}
