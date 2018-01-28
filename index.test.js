const  {Form, Field} = require('./index.js')

var noop = () => {}

class UsernameField extends Field {
  validate(value, all) {
    if (!value) return '"Username" is required.'
  }
}

class NameField extends Field {
  validate(value, all) {
    if (!value) return '"Name" is required.'
  }

  modify(value) {
    if (!value) return null
    return value.replace(/(?:^|\s)\S/g, s => s.toUpperCase())
  }
}

class PasswordField extends Field {
  validate(value, all) {
    if(!value) return '"Password" is required.'
  }

  decorate(currentValue, prevValue) {
    return "********"
  }
}

class ConfirmPasswordField extends Field {
  validate(value, all, fieldName) {
    if (value !== all[this.config.field]) return 'Passwords do not match.'
  }
}

class SignupForm extends Form {
  username = UsernameField.new()
  name = NameField.new()
  password = PasswordField.new()
  confirmPassword = ConfirmPasswordField.new({field: 'password'})
}


describe("Field.new()", () => {
  it("returns field instance", () => {
    let field = Field.new()
    expect(field instanceof Field).toEqual(true)
  })
})

describe("Field.constructor()", () => {
  it("sets default value", () => {
    const config = {
      default: 'apple'
    }
    let field = Field.new(config)
    expect(field.getData()).toEqual(config.default)
  })

  it("skips data change trigger while setting default value", () => {
    const config = {
      default: 'apple',
      onChange: jest.fn()
    }
    let field = Field.new(config)
    expect(field.getData()).toEqual(config.default)
    expect(config.onChange.mock.calls.length).toEqual(0)
  })

  it("clones default value", () => {
    const value = {}
    let field = Field.new()
    expect(field.getData()).not.toBe(value)
  })

  it("won't mark field as dirty", () => {
    const config = {
      default: 'apple'
    }
    let field = Field.new(config)
    expect(field.isDirty()).toEqual(false)
  })
})

describe("Field.setData", () => {
  it("clones and sets current value", () => {
    const value = {fruit: 'apple'}
    let field = Field.new()
    field.setData(value)

    const got = field.getData()
    expect(got).toEqual(value)
    expect(got).not.toBe(value)
  })

  it('calls modifies and sets value returned by it', () => {
    let nVal, pVal

    class AField extends Field {
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

    const field = AField.new()
    field.setData('red')
    field.setData('red apple')
    expect(field.getData()).toEqual('Red Apple')
    expect(nVal).toEqual('red apple')
    expect(pVal).toEqual('Red')
  })

  it("sets previous value", () => {
    const field = Field.new()

    field.setData('apple')
    expect(field.previousValue).toEqual(null)

    field.setData('banana')
    expect(field.previousValue).toEqual('apple')
  })

  it('calls onChange callback if exists', () => {
    const spy = jest.fn()
    const config = {
      onChange: spy
    }
    const field = Field.new(config)
    const value = 'apple'
    field.setData(value)
    expect(spy.mock.calls[0][0]).toEqual(value)
    expect(spy.mock.calls[0][1]).toBe(field)
  })

  it("won't call onChange if value has not changed", () => {
    const spy = jest.fn()
    const config = {
      onChange: spy
    }
    const field = Field.new(config)
    const value = 'apple'
    field.setData(value)
    expect(spy.mock.calls.length).toEqual(1)

    field.setData(value)
    expect(spy.mock.calls.length).toEqual(1)
  })

  it('supports debounce', async () => {
    const interval = 1000
    let check = false;
    let field = Field.new({
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
      onChange: spy
    }
    const field = Field.new(config)
    const value = 'apple'
    field.setData(value, true)
    expect(spy.mock.calls.length).toEqual(0)
  })
})

describe("Field.getData()", () => {
  it("clones and returns current value", () => {
    const value = {fruit: 'apple'}
    let field = Field.new()
    field.setData(value)

    const got = field.getData()
    expect(got).toEqual(value)
    expect(got).not.toBe(value)
  })
})

describe("Field.getCleanData", () => {
  class AField extends Field {
    clean(value) {
      return value.toUpperCase(value)
    }
  }

  it("returns data processed by Field.clean()", () => {
    const f = AField.new({default: "apple"})
    expect(f.getData()).toEqual("apple")
    expect(f.getCleanData()).toEqual("APPLE")
  })
})

describe('Field.isValid()', () => {
  class AField extends Field {
    validate(value) {
      if (!value) return 'This field is required.'
    }
  }

  it('returns true on positive validation', () => {
    let field = AField.new()
    field.setData('apple')
    
    expect(field.isValid()).toEqual(true)
  })

  it('returns false on negative validation', () => {
    let field = AField.new()
    field.setData(undefined)

    expect(field.isValid()).toEqual(false)
  })

  it('sets error', () => {
    let field = AField.new()
    field.setData(undefined)

    expect(field.isValid()).toEqual(false)
    expect(field.getError()).toMatchSnapshot()
  })

  it('wont set error if true is passed', () => {
    let field = AField.new()
    field.setData(undefined)

    expect(field.isValid(true)).toEqual(false)
    expect(field.getError()).toEqual(null)
  })

  it('can validate in relation to other form fields if exists', () => {
    class AForm extends Form {
      password = PasswordField.new()
      confirmPassword = ConfirmPasswordField.new()
    }

    const f = AForm.new()
    f.password.setData("apple")
    f.confirmPassword.setData("banana")
    expect(f.confirmPassword.isValid()).toEqual(false)
    expect(f.confirmPassword.getError()).toEqual("Passwords do not match.")
  })

  it("won't trigger onError callback if 'skipAttachError' is true", () => {
    let config = {
      onError: jest.fn()
    }
    class AField extends Field {
      validate(value, allValues) {
        if(!value) return "This field is required."
      }
    }
    let f = AField.new(config)
    expect(f.isValid(true)).toEqual(false)
    expect(config.onError.mock.calls.length).toEqual(0)
  })
})

describe('Field.setError()', () => {
  it('sets error', () => {
    const field = Field.new() 
    const errMsg = 'Nice error !!!'
    field.setError(errMsg)
    expect(field.getError()).toEqual(errMsg)
  })

  it('calls onError callback if exists', () => {
    const spy = jest.fn()
    const config = {
      onError: spy
    }
    const field = Field.new(config) 
    const errMsg = 'Nice error !!!'
    field.setError(errMsg)
    expect(spy.mock.calls.length).toEqual(1)
    expect(spy.mock.calls[0]).toMatchSnapshot()
  })

  it("wont call onError callback if 'skipError' is true", () => {
    const spy = jest.fn()
    const config = {
      onError: spy
    }
    const field = Field.new(config) 
    const errMsg = 'Nice error !!!'
    field.setError(errMsg, true)
    expect(spy.mock.calls.length).toEqual(0)
  })
})

describe('Field.getError()', () => {
  it('returns error', () => {
    const field = Field.new() 
    const errMsg = 'Nice error !!!'
    field.setError(errMsg)
    expect(field.getError()).toEqual(errMsg)
  })
})

describe('Field.isDirty()', () => {
  it('returns true for dirty field', () => {
    const field = Field.new()
    field.setData('apple')
    expect(field.isDirty()).toEqual(true)
  })

  it('returns false for non dirty field', () => {
    const field = Field.new()
    expect(field.isDirty()).toEqual(false)
  })

  it('returns false for default value', () => {
    const config = {
      default: 'apple'
    }
    const field = Field.new(config)
    expect(field.isDirty()).toEqual(false)
  })
})

describe('Field.makePrestine()', () => {
  class AField extends Field {
    validate(value) {
      if(!value) return 'This field is required.'
    }
  }

  it('sets previousValue and initialValue to currentValue', () => {
    const field = AField.new()
    field.setData('apple')
    expect(field.previousValue).toEqual(null)

    field.makePrestine()
    expect(field.previousValue).toEqual('apple')
    expect(field.initialValue).toEqual('apple')
    expect(field.isDirty()).toEqual(false)
  })

  it("empties error", () => {
    const field = AField.new()
    field.isValid()
    expect(field.getError()).toMatchSnapshot()

    field.makePrestine()
    expect(field.getError()).toEqual(null)
  })
})

describe('Field.reset()', () => {
  class AField extends Field {
    validate(value) {
      if(!value) return 'This field is required.'
    }
  }

  it('sets currentValue and previousValue to initialValue', () => {
    const config = {
      default: 'apple'
    }
    const field = AField.new(config)
    field.setData('banana')
    expect(field.currentValue).toEqual('banana')

    field.reset()

    expect(field.previousValue).toEqual('apple')
    expect(field.currentValue).toEqual('apple')
  })

  it('calls onChange callback', () => {
    const spy = jest.fn()
    const config = {
      default: 'apple',
      onChange: spy
    }
    const field = AField.new(config)
    field.setData('banana')
    expect(field.currentValue).toEqual('banana')

    field.reset()

    expect(spy.mock.calls[1][0]).toEqual('apple')
  })

  it("empties error", () => {
    const field = AField.new()
    field.isValid()
    expect(field.getError()).toMatchSnapshot()

    field.reset()
    expect(field.getError()).toEqual(null)
  })
})

describe('Field.setAndValidate()', () => {
  class AField extends Field {
    validate(value) {
      if(!value) return 'This field is required.'
    }
  }

  it('sets and validates field', () => {
    const config = {
      default: 'apple'
    }
    const field = AField.new(config)
    const error = field.setAndValidate(null)
    expect(field.isValid()).toEqual(false)
    expect(error).toMatchSnapshot()
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

  it("sets initial values", () => {
    const data = {
      username: 'ausername',
      name: 'a name'
    }
    let spy = jest.fn()
    let form = SignupForm.new({data: data, onChange: spy})
    const expected = {
      username: 'ausername',
      name: 'A Name',
      password: null,
      confirmPassword: null
    }
    expect(form.getData()).toEqual(expected)
    expect(spy.mock.calls.length).toEqual(0)
  })

  it("orders cached fields as per index")
})

describe("Form.isValid", () => {
  it("returns true if all the fields are valid", () => {
    const form = SignupForm.new()
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
    const form = SignupForm.new()
    const data = {
      username: 'ausername',
      name: 'a name',
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

  it("won't set error if true passed", () => {
    const form = SignupForm.new()
    form.isValid(true)
    expect(form.getError()).toMatchSnapshot()
  })

  it("calls onError callback", () => {
    const config = {onError: jest.fn()}
    const form = SignupForm.new(config)
    form.isValid()

    expect(config.onError.mock.calls.length).toEqual(1)
    expect(config.onError.mock.calls[0]).toMatchSnapshot()
  })

  it("won't call onError callback if 'skipAttachError' is true", () => {
    const config = {onError: jest.fn()}
    const form = SignupForm.new(config)
    form.isValid(true)

    expect(config.onError.mock.calls.length).toEqual(0)
  })

  it("respects config.stopOnError", () => {
    class AForm extends Form {
      username = UsernameField.new({index: 1})
      name = NameField.new({index: 2})
      password = PasswordField.new({index: 3})
    }
    const aform = AForm.new({stopOnError: true})
    aform.username.setData('a username')
    expect(aform.isValid()).toEqual(false)
    expect(aform.username.getError()).toEqual(null)
    expect(aform.name.getError()).toEqual('"Name" is required.')
    expect(aform.password.getError()).toEqual(null)
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
      name: 'A Name',
      password: 'apassword',
      confirmPassword: 'apassword'
    }
    form.setData(data)

    expect(config.onChange.mock.calls.length).toEqual(1)
    expect(config.onChange.mock.calls[0][0]).toEqual(data)
  })
})

describe("Form.getData", () => {
  it("returns clean data from every fields", () => {
    class AField extends Field {
      clean (value) {
        return value.toUpperCase()
      }
    }

    class AForm extends Form {
      afield = AField.new()
      username = UsernameField.new()
      password = PasswordField.new()
    }
    const form = AForm.new()
    form.afield.setData("apple")
    form.username.setData("ausername")

    const expected = {
      username: "ausername",
      password: null,
      afield: "APPLE"
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
    expect(config.onError.mock.calls[0]).toMatchSnapshot()
  })

  it("stops at first invalid field if 'haltOnError' is true")
})

describe("Form.getError", () => {
  it("returns errors from every fields", () => {
    const form = SignupForm.new()
    form.username.setError("a error")
    form.password.setError("a error")

    const expected = {
      username: "a error",
      name: null,
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

  it("empties all the error fields and calls onError callback only once", () => {
    const config = {
      onError: jest.fn()
    }
    const form = SignupForm.new(config)
    const data = {
      username: 'ausername'
    }
    form.setData(data)
    form.isValid() // first call
    expect(form.isDirty()).toEqual(true)
    expect(form.getError()).toMatchSnapshot()

    form.makePrestine() // second call
    expect(form.isDirty()).toEqual(false)
    expect(form.getError()).toMatchSnapshot()
    expect(form.getData()).toMatchSnapshot()

    expect(config.onError.mock.calls.length).toEqual(2)
  })
})

describe("Form.reset", () => {
  it("resets all the fields and calls onChange callback only once", () => {
    const config = {
      onChange: jest.fn()
    }
    const form = SignupForm.new(config)
    const data = {
      username: 'ausername',
      name: 'a name',
      password: 'apassword',
      confirmPassword: 'password confirmation'
    }
    form.setData(data) // first trigger
    form.reset() // second trigger

    const expected = {
      username: null,
      name: null,
      password: null,
      confirmPassword: null
    }
    expect(form.getData()).toEqual(expected)
    expect(config.onChange.mock.calls.length).toEqual(2)
  })

  it("resets all the errors and calls onError callback only once", () => {
    const config = {
      onError: jest.fn()
    }
    const form = SignupForm.new(config)
    form.isValid() // 1st trigger
    form.reset() // 2nd triggter

    const expected = {
      username: null,
      name: null,
      password: null,
      confirmPassword: null
    }
    expect(form.getError()).toEqual(expected)
    expect(config.onError.mock.calls.length).toEqual(2)
  })
})

describe("Form.triggerOnChange", () => {
  it("calls callback with value and form instance", () => {
    const config = {
      onChange: jest.fn()
    }
    const form = SignupForm.new(config)
    form.setData({username: 'ausername'})
    form.triggerOnChange()
    expect(config.onChange.mock.calls.length).toEqual(2)
    expect(config.onChange.mock.calls[1]).toMatchSnapshot()
  })

  it("wont call onChange callback if data has not changed")

  it("won't call onChange callback if 'getNotified' is false", () => {
    const config = {
      onChange: jest.fn()
    }
    const form = SignupForm.new(config)
    form.setData({username: 'ausername'})
    form.toggleGetNotified()
    form.triggerOnChange()
    expect(config.onChange.mock.calls.length).toEqual(1)
  })
})

describe("Form.triggerOnError", () => {
  it("calls callback with value and form instance", () => {
    const config = {
      onError: jest.fn()
    }
    const form = SignupForm.new(config)
    form.setError({username: 'an error'})
    form.triggerOnError()
    expect(config.onError.mock.calls.length).toEqual(2)
    expect(config.onError.mock.calls[1]).toMatchSnapshot()
  })

  it("wont call onError callback if errors have not changed")

  it("won't call onError callback if 'getNotified' is false", () => {
    const config = {
      onError: jest.fn()
    }
    const form = SignupForm.new(config)
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
    const form = SignupForm.new({data: data})

    var expected = {
      username: 'a username',
      name: 'A Name',
      password: null,
      confirmPassword: null
    }
    expect(form.getData()).toEqual(expected)

    expect(form.isValid()).toEqual(false)
    var expected = {
      username: null,
      name: null,
      password: '"Password" is required.',
      confirmPassword: null
    }
    expect(form.getError()).toEqual(expected)

    form.setData({password: 'a password', confirmPassword: 'a password'})
    expect(form.isValid()).toEqual(true)
  })
})

test("example", () => {
  class UsernameField extends Field {
    validate(value, allValues) {
      if(!value) {
        return "This field is required."
      }
    }
  }

  class PasswordField extends Field {
    validate(value, allValues) {
      if(value.length < 8) {
        return "This field must be at least 8 characters long."
      }
    }
  }

  class ConfirmPasswordField extends Field {
    validate(value, allValues) {
      if (value !== allValues[this.config.passwordField]) {
        return "Passwords do not match."
      }
    }
  }

  class SignupForm extends Form {
    username = UsernameField.new()
    password = PasswordField.new()
    confirmPassword = ConfirmPasswordField.new({passwordField: 'password'})
  }

  const form = SignupForm.new()

  // assign values to fields
  form.username.setData("ausername")
  form.password.setData("apassword")
  form.confirmPassword.setData("bpassword")

  // per field validation
  console.log(form.username.isValid())
  console.log(form.password.isValid())
  console.log(form.confirmPassword.isValid())
  console.log(form.confirmPassword.getError())

  // validate all the fields at once
  console.log(form.isValid())
  console.log(form.getError())
})
