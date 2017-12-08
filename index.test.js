const  {Form, Field} = require('./index.js')
const {required, isString, ValidationError, isNumber, equalsTo} = require('validatex')
const sinon = require('sinon')

var noop = () => {}

let config;
beforeEach(() => {
  config = {validator: required(true)}
})

class SignupForm extends Form {
  username = Field.new({validator: required(true)})
  password = Field.new({validator: required(true)})
  confirmPassword = Field.new({validator: equalsTo('password')})
}

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
    confirmPassword.parent = {
      getData: function () {
        return { 'password': 'apple' }
      },
      notifyDataChange: jest.fn(),
      notifyErrorChange: jest.fn()
    }
    confirmPassword.setData('banana')
    expect(confirmPassword.isValid()).toEqual(false)
    expect(confirmPassword.getError()).toMatchSnapshot()
  })

  it("works with multiple validators", () => {
    config.validator = [required(true), isNumber()]
    let field = Field.new(config)
    field.setAndValidate(undefined)
    expect(field.getError()).toEqual('This field is required.')

    field.setAndValidate('not a number')
    expect(field.getError()).toEqual("'not a number' is not a valid number.")
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

describe('Field.makePrestine()', () => {
  it('sets previousValue and initialValue to currentValue', () => {
    const field = Field.new(config)
    field.setData('apple')
    expect(field.previousValue).toEqual(null)

    field.makePrestine()
    expect(field.previousValue).toEqual('apple')
    expect(field.initialValue).toEqual('apple')
    expect(field.isDirty()).toEqual(false)
  })

  it("empties error", () => {
    const field = Field.new(config)
    field.isValid()
    expect(field.getError()).toMatchSnapshot()

    field.makePrestine()
    expect(field.getError()).toEqual(null)
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

  it('calls onChange callback', () => {
    const spy = jest.fn()
    config.default = 'apple'
    config.onChange = spy
    const field = Field.new(config)
    field.setData('banana')
    expect(field.currentValue).toEqual('banana')

    field.reset()

    expect(spy.mock.calls[2][0]).toEqual('apple')
  })

  it("empties error", () => {
    const field = Field.new(config)
    field.isValid()
    expect(field.getError()).toMatchSnapshot()

    field.reset()
    expect(field.getError()).toEqual(null)
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


describe("Form.new", () => {
  it("returns form instance", () => {
    let form = SignupForm.new()
    expect(form instanceof SignupForm).toEqual(true)
    expect(form instanceof Form).toEqual(true)
  })

  it("attaches self to each field", () => {
    let form = SignupForm.new()
    expect(form.username.parent).toBe(form)
    expect(form.password.parent).toBe(form)
    expect(form.confirmPassword.parent).toBe(form)
  })

  it("attaches field name to each field", () => {
    let form = SignupForm.new()
    expect(form.username.fieldName).toEqual('username')
    expect(form.password.fieldName).toEqual('password')
    expect(form.confirmPassword.fieldName).toEqual('confirmPassword')
  })

  it("hooks into onChange callback of each field", () => {
    let updatedData;
    const config = {
      onChange: function (data) {
        updatedData = data
      }
    }
    let form = SignupForm.new(config)
  })
})

// describe("Form.constructor")

describe("Form.isValid", () => {
  it("returns true if all the fields are valid", () => {
    const form = SignupForm.new()
    const data = {
      username: 'ausername',
      password: 'apassword',
      confirmPassword: 'apassword'
    }
    form.setData(data)
    expect(form.isValid()).toEqual(true)
  })

  it("returns false if any of the field is invalid", () => {
    const form = SignupForm.new()
    const data = {
      username: 'ausername',
      password: 'apassword',
      confirmPassword: null
    }
    form.setData(data)
    expect(form.isValid()).toEqual(false)
  })

  it("sets error", () => {
    const form = SignupForm.new()
    form.isValid()
    expect(form.getError()).toMatchSnapshot()
  })

  it("won't set error if false passed", () => {
    const form = SignupForm.new()
    form.isValid(false)
    expect(form.getError()).toMatchSnapshot()
  })

  it("calls onError callback", () => {
    const config = {onError: jest.fn()}
    const form = SignupForm.new(config)
    form.isValid()

    expect(config.onError.mock.calls.length).toEqual(1)
    expect(config.onError.mock.calls[0][0]).toMatchSnapshot()
  })
})

describe("Form.setData", () => {
  it("sets data of each field", () => {
    const form = SignupForm.new()
    const data = {
      username: 'ausername',
      password: 'apassword'
    }
    form.setData(data)

    expect(form.username.getData()).toEqual(data.username)
    expect(form.password.getData()).toEqual(data.password)
  })

  it("wont trigger update event from fields", () => {
    const config = {
      onChange: jest.fn()
    }
    const form = SignupForm.new(config)
    const data = {
      username: 'ausername',
      password: 'apassword',
      confirmPassword: 'apassword'
    }
    form.setData(data)

    expect(config.onChange.mock.calls.length).toEqual(1)
    expect(config.onChange.mock.calls[0][0]).toEqual(data)
  })
})

describe("Form.getData", () => {
  it("returns data from every fields", () => {
    const form = SignupForm.new()
    form.username.setData("ausername")
    form.password.setData("apassword")

    const expected = {
      username: "ausername",
      password: "apassword",
      confirmPassword: null
    }
    expect(form.getData()).toEqual(expected)
  })
})

describe("Form.getUpdates", () => {
  it("returns key value pair of updated fields and their value", () => {
    const form = SignupForm.new()
    form.username.setData("ausername")
    form.password.setData("apassword")

    const expected = {
      username: "ausername",
      password: "apassword"
    }
    expect(form.getUpdates()).toEqual(expected)
  })
})

describe("Form.setError", () => {
  it("sets error on each field", () => {
    const form = SignupForm.new()
    const errors = {
      username: 'a error',
      password: 'a error'
    }

    form.setError(errors)

    expect(form.username.getError()).toEqual(errors.username)
    expect(form.password.getError()).toEqual(errors.password)
  })

  it("calls onError callback only once", () => {
    const config = {
      onError: jest.fn()
    }
    const form = SignupForm.new(config)
    const errors = {
      username: 'a error',
      password: 'a error'
    }
    form.setError(errors)

    expect(config.onError.mock.calls.length).toEqual(1)
  })
})

describe("Form.getError", () => {
  it("returns errors from every fields", () => {
    const form = SignupForm.new()
    form.username.setError("a error")
    form.password.setError("a error")

    const expected = {
      username: "a error",
      password: "a error",
      confirmPassword: null
    }
    expect(form.getError()).toEqual(expected)
  })
})

describe("Form.isDirty", () => {
  it("returns true if any field's data has changed", () => {
    const form = SignupForm.new()
    form.username.setData('ausername')
    expect(form.isDirty()).toEqual(true)
  })

  it("returns false if non of the field's data has changed", () => {
    const form = SignupForm.new()
    expect(form.isDirty()).toEqual(false)
  })
})

describe("Form.makePrestine", () => {
  it("makes all the fields prestine", () => {
    const form = SignupForm.new()
    const data = {
      username: 'ausername',
      password: 'apassword',
      confirmPassword: 'password confirmation'
    }
    form.setData(data)
    expect(form.isDirty()).toEqual(true)
    form.makePrestine()
    expect(form.isDirty()).toEqual(false)
  })
})

describe("Form.reset", () => {
  it("resets all the fields", () => {
    const form = SignupForm.new()
    const data = {
      username: 'ausername',
      password: 'apassword',
      confirmPassword: 'password confirmation'
    }
    form.setData(data)
    form.reset()

    const expected = {
      username: null,
      password: null,
      confirmPassword: null
    }
    expect(form.getData()).toEqual(expected)
  })
})
