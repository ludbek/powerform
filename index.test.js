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

  it('won\'t mark field as dirty', () => {
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

  it("sets previous value", () => {
    const field = Field.new(config)

    field.setData('apple')
    expect(field.previousValue).toEqual(null)

    field.setData('banana')
    expect(field.previousValue).toEqual('apple')
  })

  it('calls onChange callback if exists')

  it('won\'t call onChange if value has not changed')
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

  it('can validate in relation to other form fields if exists')
})

describe('Field.setError()', () => {
  it('sets error', () => {
    const field = Field.new(config) 
    const errMsg = 'Nice error !!!'
    field.setError(errMsg)
    expect(field.getError()).toEqual(errMsg)
  })

  it('triggers onError callback if exists')
})

describe('Field.getError()', () => {
  it('returns error', () => {

  })
})

describe("Field", function() {
  describe(".isDirty()")
  describe(".makePrestine()")
  describe(".reset()")
  describe(".setAndValidate()")
  describe(".getDecorated()")
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
