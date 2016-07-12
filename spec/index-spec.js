var form = require("../index.js");

var noop = function () {};
var present = function (value) {
  return !value? "This field is required.": undefined;
}

describe("Form", function () {
  var aform;
  var config = {
    username: {default: 'batman',
               validator: present},
    password: {validator: function (value) {}}};

  beforeEach(function () {
    aform = form(config);
  });

  it("constructs an object", function () {
    expect(aform).toBeDefined();
  });

  it("turns keys on config dict to the attributes of the returned object", function () {
    expect(aform.username).toBeDefined();
    expect(aform.password).toBeDefined();
  });

  it("attaches original config to ._config attribute of the object", function () {
    expect(aform._config).toEqual(config);
  });

  it("sets default value to each attribute", function () {
    expect(aform.username()).toEqual('batman');
  });

  it("throws if validate function is absent in a key", function () {
    var schema = {username: {validator: function () {}},
                  password: {}};
    expect(form.bind(form, schema)).toThrowError(Error);
  });

  describe(".aProp", function () {
    var aform;
    beforeEach(function () {
      aform = form({username: {validator: noop},
                    password: {validator: noop}});
    });

    it("sets '' as default value", function () {
      expect(aform.username()).toEqual('');
    });

    it("sets default value", function () {
      var aform = form({username: {default: "batman", validator: noop}});
      expect(aform.username()).toEqual("batman");
    });

    it("is a getter and setter", function () {
      aform.username('superman');
      expect(aform.username()).toEqual('superman');
    });

    it("calls modifier with new and old values", function () {
      var newValue, oldValue;
      var aform = form({username: {default: "batman",
                                   validator: noop,
                                   modifier: function (newState, oldState) {
                                     newValue = newState;
                                     oldValue = oldState;
                                     return newState;
                                   }}});
      expect(newValue).toEqual("batman");
      expect(oldValue).toEqual("");

      aform.username("superman");
      expect(newValue).toEqual("superman");
      expect(oldValue).toEqual("batman");
    });

    describe(".isDirty()", function () {
      var aform = form({username: {default: 'ausername', validator: noop}});

      it("returns false if the value has not been altered", function () {
        expect(aform.username.isDirty()).toEqual(false);
      });

      it("returns true if the value has been altered", function () {
        aform.username('busername');
        expect(aform.username.isDirty()).toEqual(true);
      });
    });

    describe(".isValid()", function () {
      var aform;
      var config = {
        username: {default: 'batman',
                   validator: function (value) {
                     return !value? "This field is required": undefined;
                   }
                  },
        password: {validator: function (value) {}}};

      beforeEach(function () {
        aform = form(config);
      });

      it("assigns errors to .errors attribute of itself too", function () {
        aform.username("");
        aform.username.isValid();
        expect(aform.username.errors).toBeDefined();
      });

      it("empties the error field if valid value is supplied", function() {
        aform.username('spiderman');
        aform.username.isValid();
        expect(aform.errors.username).not.toBeDefined();
      });

      it("returns true if the property is valid", function () {
        aform.username("batman");
        expect(aform.username.isValid()).toEqual(true);
      });

      it("returns false if the proerty is invalid", function () {
        aform.username("");
        expect(aform.username.isValid()).toEqual(false);
      });

      it("does not set the errors if 'false' is passed", function () {
        aform.username("batman");
        aform.username.isValid();
        aform.username("");
        aform.username.isValid(false);
        expect(aform.username.errors()).not.toBeDefined();
      });

      it("cleans the value before validation", function () {
        var aform = form({username: {default: "ausername",
                                     validator: function (value) {
                                       return /^[^a][a-z]{1,8}$/.test(value)? undefined: "Error";
                                     },
                                     cleaner: function (data) {
                                       return data.replace("a", "");
                                     }
                                    }
                        });
        expect(aform.username.isValid()).toEqual(true);
      });
    });

    describe(".setAndValidate()", function () {
      var aform;
      beforeEach(function () {
        aform = form({username: {validator: present}});
      });

      it("sets the value", function () {
        aform.username.setAndValidate("ausername");
        expect(aform.username()).toEqual("ausername");
      });

      it("validates the value", function () {
        aform.username.setAndValidate("");
        expect(aform.username.errors).toBeDefined();
      });
    });

    describe(".reset()", function () {
      var aform;
      beforeEach(function () {
        aform = form({username: {validator: present, default: "baba"}});
      });

      it("resets the value", function () {
        aform.username("rara");
        aform.username.reset();
        expect(aform.username()).toEqual("baba");
      });

      it("empties its errors", function () {
        aform.username("");
        aform.username.isValid();
        expect(aform.username.errors()).toBeDefined();
        aform.username.reset();
        expect(aform.username.errors()).not.toBeDefined();
      });
    });

    describe(".errors()", function () {
      var aform;
      beforeEach(function () {
        aform = form({username: {validator: present}});
      });

      it("gets/sets the errors", function () {
        aform.username.errors("a error");
        expect(aform.username.errors()).toEqual("a error");
      });

      it("can set 'undefined' as an error", function () {
        aform.username.errors(undefined);
        expect(aform.username.errors()).toEqual(undefined);
      });
    });
  });

  describe(".isValid()", function () {
    var aform;
    beforeEach(function () {
      aform = form({
        username: {validator: present},
        password: {validator: present}});
    });

    it("exists", function () {
      expect(aform.isValid).toBeDefined();
    });

    it("returns true if form is valid", function () {
      aform.username("ausername");
      aform.password("apassword");
      expect(aform.isValid()).toEqual(true);
    });

    it("returns false if form is invalid", function () {
      aform.username("");
      aform.password("apassword");
      expect(aform.isValid()).toEqual(false);
    });

    it("sets errors if nothing is passed", function () {
      aform.username("");
      aform.password("apassword");
      aform.isValid();
      expect(aform.errors()["username"]).toBeDefined();
      expect(aform.errors()["password"]).not.toBeDefined();
    });

    it("does not change errors if 'false' is passed", function () {
      aform.username("");
      aform.password("");
      aform.isValid(false);
      expect(aform.errors()["username"]).not.toBeDefined();
      expect(aform.errors()["password"]).not.toBeDefined();
    });

    it("sets each property's errors to undefined if form validates", function () {
      aform.username("ausername");
      aform.username("apassword");
      aform.isValid();
      expect(aform.errors()["username"]).not.toBeDefined();
      expect(aform.errors()["apassword"]).not.toBeDefined();
    });

    it("it sets errors on individual properties", function () {
      aform.username("");
      aform.password("hello");
      aform.isValid();
      expect(aform.username.errors()).toBeDefined();
      expect(aform.password.errors()).not.toBeDefined();
    });
  });

  describe(".isDirty()", function () {
    var aform = form({username: {validator: present, default: 'ausername'}});

    it("exists", function () {
      expect(aform.isDirty).toBeDefined();
    });

    it("returns false if form has not been altered", function () {
      expect(aform.isDirty()).toEqual(false);
    });

    it("returns true if form has been altered", function () {
      aform.username('busername');
      expect(aform.isDirty()).toEqual(true);
    });
  });

  describe(".data()", function () {
    var aform;
    beforeAll(function () {
      aform = form({username: {default: 'ausername', validator: noop},
                    password: {default: 'apassword', validator: noop}});
    });

    it("returns the dict with key:value pair for each form field", function () {
      expect(aform.data()).toEqual({username: 'ausername', password: 'apassword'});
    });

    it("cleans the data if cleaner if present", function () {
      var cleaner = function (data) {
        return data.replace("a", "");
      };

      var aform = form({username: {default: 'ausername', cleaner: cleaner, validator: noop},
                        password: {default: 'apassword', cleaner: cleaner, validator: noop}});
      expect(aform.data()).toEqual({username: 'username', password: 'password'});
    });
  });

  describe(".errors()", function () {
    var aform;
    beforeAll(function () {
      aform = form({username: {default: 'ausername', validator: noop},
                    password: {default: 'apassword', validator: noop}});
    });

    it("sets errors on each property", function () {
      aform.errors({username: "a error"});
      expect(aform.username.errors()).toEqual("a error");
      expect(aform.password.errors()).not.toBeDefined();
    });

    it("returns the error of each property", function () {
      var errors = {username: "a error", password: "a error"};
      aform.errors(errors);
      expect(aform.errors()).toEqual(errors);
    });
  });

  describe(".reset()", function () {
    var aform;
    beforeEach(function () {
      aform = form({username: {validator: present, default: "ausername"},
                    password: {validator: present, default: "apassword"}});
    });

    it("resets value of each property", function () {
      aform.username("busername");
      aform.password("bpassword");
      aform.reset();
      expect(aform.username()).toEqual("ausername");
      expect(aform.password()).toEqual("apassword");
    });

    it("empties errors on each property", function () {
      aform.username.errors("a error");
      aform.password.errors("b password");
      aform.reset();
      expect(aform.username.errors()).not.toBeDefined();
      expect(aform.password.errors()).not.toBeDefined();
    });
  });
});
