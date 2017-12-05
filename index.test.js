import {Form, Field} from "./index.js"
import {required, isString, ValidationError, isNumber} from "validatex"
import sinon from "sinon"

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

describe("Field.isValid()", () => {
  it("sets error")
  it("wont set error if false is passed")
})

describe("Field", function() {
  describe(".setError()")
  describe(".getError()")
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
