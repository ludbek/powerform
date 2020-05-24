const { required, equalsTo, isString } = require('validatex')
const {Form, Field, powerform} = require('./index.js')

var noop = () => {}

const nameField = {
  validator: [required(true), isString()],
  modify(value) {
    if (!value) return undefined
    return value.replace(/(?:^|\s)\S/g, s => s.toUpperCase())
  }
}

const signupSchema = {
  username: [required(true), isString()],
  name: nameField,
  password: [required(true)],
  confirmPassword: [required(true), equalsTo('password')]
}

describe("field.constructor()", () => {
  it("sets default value", () => {
    const config = {
      validator: required(true),
      default: 'apple'
    }
    const field = new Field(config)
    expect(field.getData()).toEqual(config.default)
  })

  it("skips data change trigger while setting default value", () => {
    const config = {
      validator: required(true),
      default: 'apple',
      onChange: jest.fn()
    }
    const field = new Field(config)
    expect(field.getData()).toEqual(config.default)
    expect(config.onChange.mock.calls.length).toEqual(0)
  })

  it("clones default value", () => {
    const value = {}
    const config = {
      validator: required(true),
      default: value
    }
    const field = new Field(config)
    expect(field.getData()).not.toBe(value)
  })

  it("won't mark field as dirty", () => {
    const config = {
      validator: required(true),
      default: 'apple'
    }
    const field = new Field(config)
    expect(field.isDirty()).toEqual(false)
  })
})

describe("field.setData", () => {
  it("clones and sets current value", () => {
    const value = {fruit: 'apple'}
    const field = new Field(required(true))
    field.setData(value)

    const got = field.getData()
    expect(got).toEqual(value)
    expect(got).not.toBe(value)
  })

  it('calls modify and sets value returned by it', () => {
    let nVal, pVal

    const afield = {
      validator: required(true),
      modify (newVal, preVal) {
        nVal = newVal
        pVal = preVal
        return newVal.replace(
          /(?:^|\s)\S/g,
          function(s) {
            return s.toUpperCase()
          })
      }
    }

    const field = new Field(afield)
    field.setData('red')
    field.setData('red apple')
    expect(field.getData()).toEqual('Red Apple')
    expect(nVal).toEqual('red apple')
    expect(pVal).toEqual('Red')
  })

  it("sets previous value", () => {
    const field = new Field([required(true)])

    field.setData('apple')
    expect(field.previousValue).toEqual(undefined)

    field.setData('banana')
    expect(field.previousValue).toEqual('apple')
  })

  it('calls onChange callback if exists', () => {
    const spy = jest.fn()
    const config = {
      validator: required(true),
      onChange: spy
    }
    const field = new Field(config)
    const value = 'apple'
    field.setData(value)
    expect(spy.mock.calls[0][0]).toEqual(value)
    expect(spy.mock.calls[0][1]).toBe(field)
  })

  it("won't call onChange if value has not changed", () => {
    const spy = jest.fn()
    const config = {
      validator: required(true),
      onChange: spy
    }
    const field = new Field(config)
    const value = 'apple'
    field.setData(value)
    expect(spy.mock.calls.length).toEqual(1)

    field.setData(value)
    expect(spy.mock.calls.length).toEqual(1)
  })

  it('supports debounce', async () => {
    const interval = 1000
    let check = false;
    let field = new Field({
      validator: required(true),
      debounce: interval,
      onChange: value => check = true
    })
    field.setData('ap')
    expect(field.getData()).toEqual('ap')
    expect(check).toEqual(false)

    await new Promise(r => setTimeout(r, 500))
    field.setData('apple')
    expect(field.getData()).toEqual('apple')
    expect(check).toEqual(false)

    await new Promise(r => setTimeout(r, 500))
    expect(check).toEqual(false)

    await new Promise(r => setTimeout(r, 500))
    expect(check).toEqual(true)
  })

  it("won't call onChange callback if 'skipTrigger' is true", () => {
    const spy = jest.fn()
    const config = {
      validator: required(true),
      onChange: spy
    }
    const field = new Field(config)
    const value = 'apple'
    field.setData(value, true)
    expect(spy.mock.calls.length).toEqual(0)
  })
})

describe("field.getData()", () => {
  it("clones and returns current value", () => {
    const value = {fruit: 'apple'}
    let field = new Field(required(true))
    field.setData(value)

    const got = field.getData()
    expect(got).toEqual(value)
    expect(got).not.toBe(value)
  })
})

describe("field.getCleanData", () => {
  it("returns data processed by Field.clean()", () => {
    const f = new Field({
      validator: required(true),
      default: "apple",
      clean(value) {
        return value.toUpperCase(value)
      }
    })
    expect(f.getData()).toEqual("apple")
    expect(f.getCleanData()).toEqual("APPLE")
  })
})

describe('Field.isValid()', () => {
  const config = { validator: required(true) }

  it('returns true on positive validation', () => {
    const field = new Field(config)
    field.setData('apple')
    
    expect(field.isValid()).toEqual(true)
  })

  it('returns false on negative validation', () => {
    const field = new Field(config)
    field.setData(undefined)

    expect(field.isValid()).toEqual(false)
  })

  it('sets error', () => {
    const field = new Field(config)
    field.setData(undefined)

    expect(field.isValid()).toEqual(false)
    expect(field.getError()).toMatchSnapshot()
  })

  it('wont set error if true is passed', () => {
    const field = new Field(config)
    field.setData(undefined)

    expect(field.isValid(true)).toEqual(false)
    expect(field.getError()).toEqual(undefined)
  })

  it('can validate in relation to other form fields if exists', () => {
    const form = powerform({
      password: required(true),
      confirmPassword: [required(true), equalsTo('password')]
    })

    form.password.setData("apple")
    form.confirmPassword.setData("banana")
    expect(form.confirmPassword.isValid()).toEqual(false)
    expect(form.confirmPassword.getError()).toEqual("'confirmPassword' and 'password' do not match.")
  })

  it("won't trigger onError callback if 'skipAttachError' is true", () => {
    let config = {
      validator: required(true),
      onError: jest.fn()
    }
    const f = new Field(config)
    expect(f.isValid(true)).toEqual(false)
    expect(config.onError.mock.calls.length).toEqual(0)
  })
})

describe('field.setError()', () => {
  it('sets error', () => {
    const field = new Field(required(true)) 
    const errMsg = 'Nice error !!!'
    field.setError(errMsg)
    expect(field.getError()).toEqual(errMsg)
  })

  it('calls onError callback if exists', () => {
    const spy = jest.fn()
    const config = {
      validator: required(true),
      onError: spy
    }
    const field = new Field(config) 
    const errMsg = 'Nice error !!!'
    field.setError(errMsg)
    expect(spy.mock.calls.length).toEqual(1)
    expect(spy.mock.calls[0]).toMatchSnapshot()
  })

  it("wont call onError callback if 'skipError' is true", () => {
    const spy = jest.fn()
    const config = {
      validator: required(true),
      onError: spy
    }
    const field = new Field(config) 
    const errMsg = 'Nice error !!!'
    field.setError(errMsg, true)
    expect(spy.mock.calls.length).toEqual(0)
  })
})

describe('field.getError()', () => {
  it('returns error', () => {
    const field = new Field(required(true)) 
    const errMsg = 'Nice error !!!'
    field.setError(errMsg)
    expect(field.getError()).toEqual(errMsg)
  })
})

describe('field.isDirty()', () => {
  it('returns true for dirty field', () => {
    const field = new Field(required(true))
    field.setData('apple')
    expect(field.isDirty()).toEqual(true)
  })

  it('returns false for non dirty field', () => {
    const field = new Field(required(true))
    expect(field.isDirty()).toEqual(false)
  })

  it('returns false for default value', () => {
    const config = {
      validator: required(true),
      default: 'apple'
    }
    const field = new Field(config)
    expect(field.isDirty()).toEqual(false)
  })
})

describe('field.makePristine()', () => {
  it('sets previousValue and initialValue to currentValue', () => {
    const field = new Field(required(true))
    field.setData('apple')
    expect(field.previousValue).toEqual(undefined)

    field.makePristine()
    expect(field.previousValue).toEqual('apple')
    expect(field.initialValue).toEqual('apple')
    expect(field.isDirty()).toEqual(false)
  })

  it("empties error", () => {
    const field = new Field(required(true))
    field.isValid()
    expect(field.getError()).toMatchSnapshot()

    field.makePristine()
    expect(field.getError()).toEqual(undefined)
  })
})

describe('field.reset()', () => {
  it('sets currentValue and previousValue to initialValue', () => {
    const config = {
      validator: required(true),
      default: 'apple'
    }
    const field = new Field(config)
    field.setData('banana')
    expect(field.currentValue).toEqual('banana')

    field.reset()

    expect(field.previousValue).toEqual('apple')
    expect(field.currentValue).toEqual('apple')
  })

  it('calls onChange callback', () => {
    const spy = jest.fn()
    const config = {
      validator: required(true),
      default: 'apple',
      onChange: spy
    }
    const field = new Field(config)
    field.setData('banana')
    expect(field.currentValue).toEqual('banana')

    field.reset()

    expect(spy.mock.calls[1][0]).toEqual('apple')
  })

  it("empties error", () => {
    const field = new Field(required(true))
    field.isValid()
    expect(field.getError()).toMatchSnapshot()

    field.reset()
    expect(field.getError()).toEqual(undefined)
  })
})

describe('field.setAndValidate()', () => {
  it('sets and validates field', () => {
    const config = {
      validator: required(true),
      default: 'apple'
    }
    const field = new Field(config)
    const error = field.setAndValidate(undefined)
    expect(field.isValid()).toEqual(false)
    expect(error).toMatchSnapshot()
  })
})

describe("powerform", () => {
  it("returns form instance", () => {
    const form = powerform(signupSchema)
    expect(form instanceof Form).toEqual(true)
  })

  it("attaches self to each field", () => {
    const form = powerform(signupSchema)
    expect(form.username.parent).toBe(form)
    expect(form.password.parent).toBe(form)
    expect(form.confirmPassword.parent).toBe(form)
  })

  it("attaches field name to each field", () => {
    const form = powerform(signupSchema)
    expect(form.username.fieldName).toEqual('username')
    expect(form.password.fieldName).toEqual('password')
    expect(form.confirmPassword.fieldName).toEqual('confirmPassword')
  })

  it("sets initial values", () => {
    const data = {
      username: 'ausername',
      name: 'a name'
    }
    let spy = jest.fn()
    const form = powerform(signupSchema, {data, onChange: spy})
    const expected = {
      username: 'ausername',
      name: 'A Name',
      password: undefined,
      confirmPassword: undefined
    }
    expect(form.getData()).toEqual(expected)
    expect(spy.mock.calls.length).toEqual(0)
  })

  it("orders cached fields as per index", () => {
    const form = powerform({
      username: {validator: required(true), inddx: 1},
      password: {validator: required(true), index: 0}
    })
    expect(form.fieldNames).toEqual(['username', 'password'])
  })
})

describe("form.isValid", () => {
  it("returns true if all the fields are valid", () => {
    const form = powerform(signupSchema)
    const data = {
      username: 'ausername',
      name: 'a name',
      password: 'apassword',
      confirmPassword: 'apassword'
    }
    form.setData(data)
    expect(form.isValid()).toEqual(true)
  })

  it("returns false if any of the field is invalid", () => {
    const form = powerform(signupSchema)
    const data = {
      username: 'ausername',
      name: 'a name',
      password: 'apassword',
      confirmPassword: undefined
    }
    form.setData(data)
    expect(form.isValid()).toEqual(false)
  })

  it("sets error", () => {
    const form = powerform(signupSchema)
    form.isValid()
    expect(form.getError()).toMatchSnapshot()
  })

  it("won't set error if 'skipAttachError' true passed", () => {
    const form = powerform(signupSchema)
    form.isValid(true)
    expect(form.getError()).toMatchSnapshot()
  })

  it("calls onError callback", () => {
    const config = {onError: jest.fn()}
    const form = powerform(signupSchema, config)
    form.isValid()

    expect(config.onError.mock.calls.length).toEqual(1)
    expect(config.onError.mock.calls[0]).toMatchSnapshot()
  })

  it("won't call onError callback if 'skipAttachError' is true", () => {
    const config = {onError: jest.fn()}
    const form = powerform(signupSchema, config)
    form.isValid(true)

    expect(config.onError.mock.calls.length).toEqual(0)
  })

  it("respects config.stopOnError", () => {
    const schema = {
      username: {validator: required(true), index: 1},
      name: {validator: required(true), index: 2},
      password: {validator: required(true), index: 3}
    }
    const config = {stopOnError: true}
    const form = powerform(schema, config)
    form.username.setData('a username')
    expect(form.isValid()).toEqual(false)
    expect(form.username.getError()).toEqual(undefined)
    expect(form.name.getError()).toEqual('This field is required.')
    expect(form.password.getError()).toEqual(undefined)
  })
})

describe("form.setData", () => {
  it("sets data of each field", () => {
    const form = powerform(signupSchema)
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
    const form = powerform(signupSchema, config)
    const data = {
      username: 'ausername',
      name: 'A Name',
      password: 'apassword',
      confirmPassword: 'apassword'
    }
    form.setData(data)

    expect(config.onChange.mock.calls.length).toEqual(1)
    expect(config.onChange.mock.calls[0][0]).toEqual(data)
  })
})

describe("form.getData", () => {
  it("returns clean data from every fields", () => {
    const afield = {
      validator: required(true),
      clean (value) {
        return value.toUpperCase()
      }
    }

    const schema = {
      afield,
      username: required(true),
      password: required(true)
    }
    const form = powerform(schema)

    form.afield.setData("apple")
    form.username.setData("ausername")

    const expected = {
      username: "ausername",
      password: undefined,
      afield: "APPLE"
    }
    expect(form.getData()).toEqual(expected)
  })
})

describe("form.getUpdates", () => {
  it("returns key value pair of updated fields and their value", () => {
    const form = powerform(signupSchema)
    form.username.setData("ausername")
    form.password.setData("apassword")

    const expected = {
      username: "ausername",
      password: "apassword"
    }
    expect(form.getUpdates()).toEqual(expected)
  })
})

describe("form.setError", () => {
  it("sets error on each field", () => {
    const form = powerform(signupSchema)
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
    const form = powerform(signupSchema, config)
    const errors = {
      username: 'a error',
      password: 'a error'
    }
    form.setError(errors)

    expect(config.onError.mock.calls.length).toEqual(1)
    expect(config.onError.mock.calls[0]).toMatchSnapshot()
  })
})

describe("form.getError", () => {
  it("returns errors from every fields", () => {
    const form = powerform(signupSchema)
    form.username.setError("a error")
    form.password.setError("a error")

    const expected = {
      username: "a error",
      name: undefined,
      password: "a error",
      confirmPassword: undefined
    }
    expect(form.getError()).toEqual(expected)
  })
})

describe("form.isDirty", () => {
  it("returns true if any field's data has changed", () => {
    const form = powerform(signupSchema)
    form.username.setData('ausername')
    expect(form.isDirty()).toEqual(true)
  })

  it("returns false if non of the field's data has changed", () => {
    const form = powerform(signupSchema)
    expect(form.isDirty()).toEqual(false)
  })
})

describe("form.makePristine", () => {
  it("makes all the fields prestine", () => {
    const form = powerform(signupSchema)
    const data = {
      username: 'ausername',
      password: 'apassword',
      confirmPassword: 'password confirmation'
    }
    form.setData(data)
    expect(form.isDirty()).toEqual(true)
    form.makePristine()
    expect(form.isDirty()).toEqual(false)
  })

  it("empties all the error fields and calls onError callback only once", () => {
    const config = {
      onError: jest.fn()
    }
    const form = powerform(signupSchema, config)
    const data = {
      username: 'ausername'
    }
    form.setData(data)
    form.isValid() // first call
    expect(form.isDirty()).toEqual(true)
    expect(form.getError()).toMatchSnapshot()

    form.makePristine() // second call
    expect(form.isDirty()).toEqual(false)
    expect(form.getError()).toMatchSnapshot()
    expect(form.getData()).toMatchSnapshot()
    expect(config.onError.mock.calls.length).toEqual(2)
  })
})

describe("form.reset", () => {
  it("resets all the fields and calls onChange callback only once", () => {
    const config = {
      onChange: jest.fn()
    }
    const form = powerform(signupSchema, config)
    const data = {
      username: 'ausername',
      name: 'a name',
      password: 'apassword',
      confirmPassword: 'password confirmation'
    }
    form.setData(data) // first trigger
    form.reset() // second trigger

    const expected = {
      username: undefined,
      name: undefined,
      password: undefined,
      confirmPassword: undefined
    }
    expect(form.getData()).toEqual(expected)
    expect(config.onChange.mock.calls.length).toEqual(2)
  })

  it("resets all the errors and calls onError callback only once", () => {
    const config = {
      onError: jest.fn()
    }
    const form = powerform(signupSchema, config)
    form.isValid() // 1st trigger
    form.reset() // 2nd triggter

    const expected = {
      username: undefined,
      name: undefined,
      password: undefined,
      confirmPassword: undefined
    }
    expect(form.getError()).toEqual(expected)
    expect(config.onError.mock.calls.length).toEqual(2)
  })
})

describe("form.triggerOnChange", () => {
  it("calls callback with value and form instance", () => {
    const config = {
      onChange: jest.fn()
    }
    const form = powerform(signupSchema, config)
    form.setData({username: 'ausername'})
    form.triggerOnChange()
    expect(config.onChange.mock.calls.length).toEqual(2)
    expect(config.onChange.mock.calls[1]).toMatchSnapshot()
  })

  it("won't call onChange callback if 'getNotified' is false", () => {
    const config = {
      onChange: jest.fn()
    }
    const form = powerform(signupSchema, config)
    form.setData({username: 'ausername'})
    form.toggleGetNotified()
    form.triggerOnChange()
    expect(config.onChange.mock.calls.length).toEqual(1)
  })
})

describe("form.triggerOnError", () => {
  it("calls callback with value and form instance", () => {
    const config = {
      onError: jest.fn()
    }
    const form = powerform(signupSchema, config)
    form.setError({username: 'an error'})
    form.triggerOnError()
    expect(config.onError.mock.calls.length).toEqual(2)
    expect(config.onError.mock.calls[1]).toMatchSnapshot()
  })

  it("won't call onError callback if 'getNotified' is false", () => {
    const config = {
      onError: jest.fn()
    }
    const form = powerform(signupSchema, config)
    form.isValid()
    form.toggleGetNotified()
    form.triggerOnError()
    expect(config.onError.mock.calls.length).toEqual(1)
  })
})

describe("Usage", () => {
  it('works with normal validation', () => {
    const data = {
      username: 'a username',
      name: 'a name'
    }
    const form = powerform(signupSchema, {data})

    var expected = {
      username: 'a username',
      name: 'A Name',
      password: undefined,
      confirmPassword: undefined
    }
    expect(form.getData()).toEqual(expected)

    expect(form.isValid()).toEqual(false)
    var expected = {
      username: undefined,
      name: undefined,
      password: 'This field is required.',
      confirmPassword: 'This field is required.'
    }
    expect(form.getError()).toEqual(expected)

    form.setData({password: 'a password', confirmPassword: 'a password'})
    expect(form.isValid()).toEqual(true)
  })
})
