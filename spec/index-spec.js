var Form = require("../index.js")

describe("Form", function () {
  var formModel
  var config = {
    username: {default: 'batman', presence: true},
    password: {}}
  beforeEach(function () {
    formModel = new Form(config)
    })

  it("constructs an object", function () {
    expect(formModel).toBeDefined()
    })

  it("turns keys on config dict to the attributes of the returned object", function () {
    expect(formModel.username).toBeDefined()
    expect(formModel.password).toBeDefined()
    })

  it("attaches original config to ._config attribute of the object", function () {
    expect(formModel._config).toEqual(config)
    })

  it("sets default value to each attribute", function () {
    expect(formModel.username()).toEqual('batman')
    })

  it("sets .isValid() method", function () {
    expect(formModel.isValid).toBeDefined()
    })

  it("sets .isDirty() method", function () {
    expect(formModel.isDirty).toBeDefined()
    })

  describe(".aProp", function () {
    var aform
    beforeEach(function () {
      aform = new Form({
        username: {presence: true},
        password: {}})})

    it("sets '' default value", function () {
      expect(aform.username()).toEqual('')})

    it("sets default value", function () {
      var aform = new Form({username: {default: "batman"}})
      expect(aform.username()).toEqual("batman")})

    it("is a getter and setter", function () {
      aform.username('superman');
      expect(aform.username()).toEqual('superman')})

    describe(".isDirty()", function () {
      var aform = new Form({username: {default: 'ausername', presence: true}})

      it("returns false if the value has not been altered", function () {
        expect(aform.username.isDirty()).toEqual(false)
        });

      it("returns true if the value has been altered", function () {
        aform.username('busername')
        expect(aform.username.isDirty()).toEqual(true)
        })
      })

    describe(".isValid()", function () {
      it("assigns errors to .errors attribute of itself too", function () {
        formModel.username("")
        formModel.username.isValid()
        expect(formModel.username.errors).toBeDefined()
        })

      it("empties the error field if valid value is supplied", function() {
        formModel.username('spiderman')
        formModel.username.isValid()
        expect(formModel.errors.username).not.toBeDefined()
        })

      it("validates against dependent field if equality is set", function () {
        var form = new Form({
          password: {presence: true},
          confirmPassword: {equality: "password"}})

        form.password("flash")
        form.confirmPassword("quicksilver")
        form.confirmPassword.isValid()
        expect(form.confirmPassword.errors()).toBeDefined()

        form.confirmPassword("flash")
        form.confirmPassword.isValid()
        expect(form.errors.confirmPassword).not.toBeDefined()
      })

      it("returns true if the property is valid", function () {
        formModel.username("batman")
        expect(formModel.username.isValid()).toEqual(true)
      })

      it("returns false if the proerty is invalid", function () {
        formModel.username("")
        expect(formModel.username.isValid()).toEqual(false)
      })

      it("does not set the errors if 'false' is passed", function () {
        formModel.username("batman")
        formModel.username.isValid()
        formModel.username("")
        formModel.username.isValid(false)
        expect(formModel.username.errors()).not.toBeDefined()
      })
     })

    describe(".setAndValidate()", function () {
      var aform
      beforeEach(function () {
        aform = new Form({username: {presence: true}})
      })

      it("sets the value", function () {
        aform.username.setAndValidate("ausername")
        expect(aform.username()).toEqual("ausername")
      })

      it("validates the value", function () {
        aform.username.setAndValidate("")
        expect(aform.username.errors).toBeDefined()
      })
    })

    describe(".reset()", function () {
      var aform
      beforeEach(function () {
        aform = new Form({username: {presence: true, default: "baba"}})
      })

      it("resets the value", function () {
        aform.username("rara")
        aform.username.reset()
        expect(aform.username()).toEqual("baba")
      })

      it("empties its errors", function () {
        aform.username("")
        aform.username.isValid()
        expect(aform.username.errors()).toBeDefined()
        aform.username.reset()
        expect(aform.username.errors()).not.toBeDefined()
      })
    })

    describe(".errors()", function () {
      var aform
      beforeEach(function () {
        aform = new Form({username: {presence: true}})
      })

      it("gets/sets the errors", function () {
        aform.username.errors("a error")
        expect(aform.username.errors()).toEqual("a error")
      })

      it("can set 'undefined' as an error", function () {
        aform.username.errors(undefined)
        expect(aform.username.errors()).toEqual(undefined)
      })
    })
  })

  describe(".isValid()", function () {
    var aform
    beforeEach(function () {
      aform = new Form({
        username: {presence: true},
        password: {presence: true}})
    })

    it("returns true if form is valid", function () {
      aform.username("ausername")
      aform.password("apassword")
      expect(aform.isValid()).toEqual(true)
      })

    it("returns false if form is invalid", function () {
      aform.username("")
      aform.password("apassword")
      expect(aform.isValid()).toEqual(false)
      })

    it("sets errors if nothing is passed", function () {
      aform.username("")
      aform.password("apassword")
      aform.isValid()
      expect(aform.errors()["username"]).toBeDefined()
      expect(aform.errors()["password"]).not.toBeDefined()
    })

    it("does not change errors if 'false' is passed", function () {
      aform.username("")
      aform.password("")
      aform.isValid(false)
      expect(aform.errors()["username"]).not.toBeDefined()
      expect(aform.errors()["password"]).not.toBeDefined()
    })

    it("sets each property's errors to undefined if form validates", function () {
      aform.username("ausername")
      aform.username("apassword")
      aform.isValid()
      expect(aform.errors()["username"]).not.toBeDefined()
      expect(aform.errors()["apassword"]).not.toBeDefined()
    })

    it("it sets errors on individual properties", function () {
      aform.username("")
      aform.password("hello")
      aform.isValid()
      expect(aform.username.errors()).toBeDefined()
      expect(aform.password.errors()).not.toBeDefined()
    })
  })

  describe(".isDirty()", function () {
    var aform = new Form({username: {presence: true, default: 'ausername'}})

    it("returns false if form has not been altered", function () {
      expect(aform.isDirty()).toEqual(false)
      })

    it("returns true if form has been altered", function () {
      aform.username('busername')
      expect(aform.isDirty()).toEqual(true)
      })
    })

  describe(".data()", function () {
    var aform
    beforeAll(function () {
      aform = new Form(
        {username: {default: 'ausername'},
        password: {default: 'apassword'}})
      })

    it("returns the dict with key:value pair for each form field", function () {
      expect(aform.data()).toEqual({username: 'ausername', password: 'apassword'})
      })
    })

  describe(".errors()", function () {
    var aform
    beforeAll(function () {
      aform = new Form(
        {username: {default: 'ausername'},
        password: {default: 'apassword'}})
      })

    it("sets errors on each property", function () {
      aform.errors({username: "a error"})
      expect(aform.username.errors()).toEqual("a error")
      expect(aform.password.errors()).not.toBeDefined()
    })

    it("returns the error of each property", function () {
      var errors = {username: "a error", password: "a error"}
      aform.errors(errors)
      expect(aform.errors()).toEqual(errors)
    })
  })

  describe(".reset()", function () {
    var aform
    beforeEach(function () {
      aform = new Form({
        username: {presence: true, default: "ausername"},
        password: {presence: true, default: "apassword"}})
    })

    it("resets value of each property", function () {
      aform.username("busername")
      aform.password("bpassword")
      aform.reset()
      expect(aform.username()).toEqual("ausername")
      expect(aform.password()).toEqual("apassword")
    })

    it("empties errors on each property", function () {
      aform.username.errors("a error")
      aform.password.errors("b password")
      aform.reset()
      expect(aform.username.errors()).not.toBeDefined()
      expect(aform.password.errors()).not.toBeDefined()
    })
  })
})