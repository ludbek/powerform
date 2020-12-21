import { validateSingle } from 'validatex';
const STOP_VALIDATION_ERROR_NAME = 'StopValidationError'

class StopValidationError extends Error {
  constructor() {
    super()
    this.name = STOP_VALIDATION_ERROR_NAME
  }
} 

const clone = (data) => {
  if(data === undefined) return null
  if (!data) return data;
  return JSON.parse(JSON.stringify(data));
};

const cloneObj = (obj) => {
  const clonedObj = {}
  for (const key in obj) {
    clonedObj[key] = obj[key]
  }
  return clonedObj
}

const isEqual = (val1, val2) => {
  return JSON.stringify(val1) === JSON.stringify(val2);
};

class Field {
  constructor (validator) {
    // its an object
    if(validator.validator) {
      const clonedValidator = cloneObj(validator)
      this.validator = clonedValidator.validator
      delete clonedValidator.validator
      this.config = clonedValidator
    }
    // its a function
    else {
      this.validator = validator
      this.config = {}
    }

    this.error = null
    this.previousValue = null
    this.currentValue = null
    this.initialValue = null
    this.defaultValue = this.initialValue = this.config.default === undefined || this.config.default === null
      ? null
      : clone(this.config.default)
    // will call onChange callback if exists
    this.setData(this.defaultValue, true)
    this.makePristine()
  }

  clean(newVal) {
    const clean = this.config.clean
    if(clean) {
      return clean(newVal)
    }

    return newVal
  }

  modify(newVal, preVal) {
    const modify = this.config.modify
    if(modify) {
      return modify(newVal, preVal)
    }
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

  validate() {
    const error = validateSingle(
      this.currentValue,
      this.validator,
      this.multipleErrors,
      this.parent.getData(),
      this.fieldName
    )
    this.setError(error)
    return !error
  }

  isValid() {
    const error = validateSingle(
      this.currentValue,
      this.validator,
      this.multipleErrors,
      this.parent.getData(),
      this.fieldName
    )
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

  makePristine() {
    this.previousValue = clone(this.currentValue)
    this.initialValue = clone(this.currentValue)
    this.setError(null)
  }

  reset() {
    this.setData(clone(this.initialValue))
    this.makePristine()
  }

  setAndValidate(value) {
    this.setData(value)
    this.validate()
    return this.getError()
  }
}

class Form {
  toggleGetNotified() {
    this.getNotified = !this.getNotified
  }

  setData(data, skipTrigger) {
    this.toggleGetNotified()
    for(const prop in data) {
      if (this.fieldNames.indexOf(prop) !== -1) {
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
    return this.fieldNames.reduce((acc, fieldName) => {
      acc[fieldName] = this[fieldName].getCleanData()
      return acc
    }, {})
  }

  getUpdates() {
    return this.fieldNames.reduce((acc, fieldName) => {
      if (this[fieldName].isDirty()) {
        acc[fieldName] = this[fieldName].getData()
      }
      return acc
    }, {})
  }

  setError(errors, skipTrigger) {
    this.toggleGetNotified()
    for(const field in errors) {
      if(this.fieldNames.indexOf(field) !== -1) {
        this[field].setError(errors[field], skipTrigger)
      }
    }
    this.toggleGetNotified()

    if (skipTrigger) return
    this.triggerOnError()
  }

  getError() {
    return this.fieldNames.reduce((acc, fieldName) => {
      acc[fieldName] = this[fieldName].getError()
      return acc
    }, {})
  }

  isDirty() {
    for(const field of this.fieldNames) {
      if(this[field].isDirty()) return true
    }
    return false
  }

  makePristine() {
    this.toggleGetNotified()
    this.fieldNames.forEach((field) => {
      this[field].makePristine()
    })
    this.toggleGetNotified()
    this.triggerOnError()
  }

  reset() {
    this.toggleGetNotified()
    this.fieldNames.forEach((field) => {
      this[field].reset()
    })
    this.toggleGetNotified()
    this.triggerOnError()
    this.triggerOnChange()
  }

  _validate(skipAttachError) {
    let status
    this.toggleGetNotified()

    try {
      status = this.fieldNames.reduce((acc, field) => {
        let validity
        if(skipAttachError) {
          validity = this[field].isValid()
        }
        else {
          validity = this[field].validate()
        }
        if (!validity && this.config.stopOnError) {
          throw new StopValidationError()
        }
        return validity && acc
      }, true)
    }
    catch (err) {
      if (err.name === STOP_VALIDATION_ERROR_NAME) {
        status = false
      }
      else {
        throw err
      }
    }

    this.toggleGetNotified()
    return status
  }

  validate() {
    const validity = this._validate(false)
    this.triggerOnError()
    return validity
  }

  isValid() {
    return this._validate(true)
  }
}

function powerform(fields, config = {}) {
  const form = new Form()
  form.fieldNames = []
  form.config = config
  form.getNotified = true

  for(const fieldName in fields) {
    const field = new Field(fields[fieldName])
    const index = field.index
    field.parent = form
    field.fieldName = fieldName
    field.multipleErrors = form.config.multipleErrors || false
    form[fieldName] = field

    if (index) {
      form.fieldNames[index] = fieldName
    }
    else {
      form.fieldNames.push(fieldName)
    }
  }

  config.data && form.setData(config.data, true)
  return form
}

module.exports = {
  Form,
  Field,
  powerform
}
