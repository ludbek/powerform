import {validateSingle, validate, required} from "validatex";

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
    this.defaultValue = !config || typeof(config.default) === 'undefined'
      ? null
      : clone(config.default)
    this.initialValue = this.defaultValue
    this.previousValue = null
    this.currentValue = this.defaultValue
  }

  static new (config) {
    return new this(config)
  }

  setData(value) {
    this.previousValue = clone(this.currentValue)
    this.currentValue = clone(value)
  }

  getData() {
    return clone(this.currentValue)
  }

  isValid(attachError) {
  }
}

class Form {

}

module.exports = {
  Form,
  Field
}
