const  {Form, Field} = require('./index.js')
const {required, isString, ValidationError, isNumber} = require('validatex')
const sinon = require('sinon')

var noop = () => {}

let config;
beforeEach(() => {
  config = {validator: required(true)}
})


describe("Field.new()", () => {
  it("returns field instance", () => {
    let field = Field.new(config)
    expect(field instanceof Field).toEqual(true)
  })
})

describe("Field.constructor()", () => {
  it("sets default value", () => {
    config.default = 'apple'
    let field = Field.new(config)
    expect(field.getData()).toEqual(config.default)
  })

  it("clones default value", () => {
    const value = {}
    let field = Field.new(config)
    expect(field.getData()).not.toBe(value)
  })

  it("won't mark field as dirty", () => {
    config.default = 'apple'
    let field = Field.new(config)
    expect(field.isDirty()).toEqual(false)
  })
})

describe("Field.setData", () => {
  it("clones and sets current value", () => {
    const value = {fruit: 'apple'}
    let field = Field.new(config)
    field.setData(value)

    const got = field.getData()
    expect(got).toEqual(value)
    expect(got).not.toBe(value)
  })

  it('calls modifier and sets value returned by it', () => {
    config.modifier = function (newVal, prevVal) {
      return newVal.replace(
				/(?:^|\s)\S/g,
				function(s) {
					return s.toUpperCase()
				})
    }
    const field = Field.new(config)
    field.setData('red apple')
    expect(field.getData()).toEqual('Red Apple')
  })

  it("sets previous value", () => {
    const field = Field.new(config)

    field.setData('apple')
    expect(field.previousValue).toEqual(null)

    field.setData('banana')
    expect(field.previousValue).toEqual('apple')
  })

  it('calls onChange callback if exists', () => {
    const spy = jest.fn()
    config.onChange = spy
    const field = Field.new(config)
    const value = 'apple'
    field.setData(value)
    expect(spy.mock.calls[0][0]).toEqual(value)
  })

  it("won't call onChange if value has not changed", () => {
    const spy = jest.fn()
    config.onChange = spy
    const field = Field.new(config)
    const value = 'apple'
    field.setData(value)
    expect(spy.mock.calls.length).toEqual(1)

    field.setData(value)
    expect(spy.mock.calls.length).toEqual(1)
  })
})

describe("Field.getData()", () => {
  it("clones and returns current value", () => {
    const value = {fruit: 'apple'}
    let field = Field.new(config)
    field.setData(value)

    const got = field.getData()
    expect(got).toEqual(value)
    expect(got).not.toBe(value)
  })
})

describe('Field.isValid()', () => {
  it('returns true on positive validation', () => {
    let field = Field.new(config)
    field.setData('apple')
    
    expect(field.isValid()).toEqual(true)
  })

  it('returns false on negative validation', () => {
    let field = Field.new(config)
    field.setData(undefined)

    expect(field.isValid()).toEqual(false)
  })

  it('sets error', () => {
    let field = Field.new(config)
    field.setData(undefined)

    expect(field.isValid()).toEqual(false)
    expect(field.getError()).toMatchSnapshot()
  })

  it('wont set error if false is passed', () => {
    let field = Field.new(config)
    field.setData(undefined)

    expect(field.isValid(false)).toEqual(false)
    expect(field.getError()).toEqual(null)
  })

  it('can validate in relation to other form fields if exists', () => {
    config.validator = function (value, siblingData) {
      return value !== siblingData.password
        ? "'password' and 'confirm password' should match."
        : null
    }
    const confirmPassword = Field.new(config)
    confirmPassword.getSiblingData = function () {
      return {
        'password': 'apple'
      }
    }
    confirmPassword.setData('banana')
    expect(confirmPassword.isValid()).toEqual(false)
    expect(confirmPassword.getError()).toMatchSnapshot()
  })
})

describe('Field.setError()', () => {
  it('sets error', () => {
    const field = Field.new(config) 
    const errMsg = 'Nice error !!!'
    field.setError(errMsg)
    expect(field.getError()).toEqual(errMsg)
  })

  it('calls onError callback if exists', () => {
    const spy = jest.fn()
    config.onError = spy
    const field = Field.new(config) 
    const errMsg = 'Nice error !!!'
    field.setError(errMsg)
    expect(spy.mock.calls.length).toEqual(1)
  })
})

describe('Field.getError()', () => {
  it('returns error', () => {
    const field = Field.new(config) 
    const errMsg = 'Nice error !!!'
    field.setError(errMsg)
    expect(field.getError()).toEqual(errMsg)
  })
})

describe('Field.isDirty()', () => {
  it('returns true for dirty field', () => {
    const field = Field.new(config)
    field.setData('apple')
    expect(field.isDirty()).toEqual(true)
  })

  it('returns false for non dirty field', () => {
    const field = Field.new(config)
    expect(field.isDirty()).toEqual(false)
  })

  it('returns false for default value', () => {
    config.default = 'apple'
    const field = Field.new(config)
    expect(field.isDirty()).toEqual(false)
  })
})

describe('.makePrestine()', () => {
  it('sets previousValue and initialValue to currentValue', () => {
    const field = Field.new(config)
    field.setData('apple')
    expect(field.previousValue).toEqual(null)

    field.makePrestine()
    expect(field.previousValue).toEqual('apple')
    expect(field.initialValue).toEqual('apple')
    expect(field.isDirty()).toEqual(false)
  })
})

describe('Field.reset()', () => {
  it('sets currentValue and previousValue to initialValue', () => {
    config.default = 'apple'
    const field = Field.new(config)
    field.setData('banana')
    expect(field.currentValue).toEqual('banana')

    field.reset()

    expect(field.previousValue).toEqual('apple')
    expect(field.currentValue).toEqual('apple')
  })
})

describe('Field.setAndValidate()', () => {
  it('sets and validates field', () => {
    config.default = 'apple'
    const field = Field.new(config)
    const error = field.setAndValidate(null)
    expect(field.isValid()).toEqual(false)
    expect(error).toMatchSnapshot()
  })
})

describe("Field.getDecorated()", () => {
  it('returns what config.decorator returns', () => {
    config.decorator = function (newVal, prevVal) {
      return newVal.replace(
				/(?:^|\s)\S/g,
				function(s) {
					return s.toUpperCase()
				})
    }

    const field = Field.new(config)
    field.setData('white tiger')
    expect(field.getDecorated()).toEqual('White Tiger')
  })

  it('returns current value if no decorator is provided', () => {
    const field = Field.new(config)
    field.setData('white tiger')
    expect(field.getDecorated()).toEqual('white tiger')
  })
})

describe("Form", function() {
  it("is a constructor", () => {
    // class UserForm extends Form {
    //   username = Field.new({
    //     default: "suren",
    //     validator:,
    //     debounce:,
    //     onChange:,
    //     onError:,
    //     decorator:,
    //     modifier:
    //   })
    // }
    // const config = {
    //   onData:,
    //   onError:
    // }
    // let form = Form.new(config)
  })

  describe(".isValid()")
  describe(".setData")
  describe(".getData()")
  describe(".setError()")
  describe(".getError()")
  describe(".isDirty()")
  describe(".makePrestine()")
  describe(".reset()")
  describe(".getUpdates()")
})
