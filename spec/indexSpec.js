import form from "../index.js";
import chai from "chai";
import {required, isString, ValidationError, isNumber} from "validatex";

let expect = chai.expect;

var noop = () => {};

describe("Form", () => {
  var aform;
  var config = {
    username: {default: 'batman',
               validator: required(true)},
    password: {validator: function (value) {}}};

  beforeEach(() => {
    aform = form(config);
  });

  it("constructs an object", () => {
    expect(aform).to.exist;
  });

  it("turns keys on config dict to the attributes of the returned object", () => {
    expect(aform.username).to.exist;
    expect(aform.password).to.exist;
  });

  it("attaches original config to ._config attribute of the object", () => {
    expect(aform._config).to.equal(config);
  });

  it("sets default value to each attribute", () => {
    expect(aform.username()).to.equal('batman');
  });

  it("can set '' as default value.", () => {
    let aform = form({
      name: {default: "", validator: required(true)}
    });

    expect(aform.name()).to.eql("");
  });

  it("throws if validator is absent in a key", () => {
    var schema = {username: {validator: () => {}},
                  password: {}};
    expect(form.bind(form, schema)).to.throw(Error);
  });

  it("throws if validator is neither a function nor an array.", () => {
    var schema = {username: "invalid"};
    expect(form.bind(form, schema)).to.throw(Error);

    var schema = {
      username: {
        validator: "invalid"
      }
    };
    expect(form.bind(form, schema)).to.throw(Error);
  });

  describe(".aProp", () => {
    var aform;
    beforeEach(() => {
      aform = form({username: {validator: noop},
                    password: {validator: noop}});
    });

    it("sets 'null' as default value", () => {
      expect(aform.username()).to.equal(null);
    });

    it("sets default value", () => {
      var aform = form({username: {default: "batman", validator: noop}});
      expect(aform.username()).to.equal("batman");
    });

    it("is a getter and setter", () => {
      aform.username('superman');
      expect(aform.username()).to.equal('superman');
    });

    it("won't convert number into string", () => {
      let aform = form({
        mobile: [required(true), isNumber()]
      });

      aform.mobile(100);

      expect(aform.mobile()).to.equal(100);

      aform.isValid();

      expect(aform.mobile()).to.equal(100);
    });

    it("calls modifier with new and old values", () => {
      var newValue, oldValue;
      var aform = form({username: {default: "batman",
                                   validator: noop,
                                   modifier: function (newState, oldState) {
                                     newValue = newState;
                                     oldValue = oldState;
                                     return newState;
                                   }}});
      expect(newValue).to.equal("batman");
      expect(oldValue).to.equal(null);

      aform.username("superman");
      expect(newValue).to.equal("superman");
      expect(oldValue).to.equal("batman");
    });

    it("projects changes specific to the field.", () => {
      var fieldValue, modelData, dform;

      var projector = (field, all, model) => {
        fieldValue = field;
        modelData = all;
        dform = model;
      };

      var aform = form({
        username: {validator: required(true), projector: projector},
        password: required(true)
      });

      aform.password("apassword");
      expect(fieldValue).to.equal(undefined);

      aform.username("ausername");
      expect(fieldValue).to.equal("ausername");
      expect(modelData).to.eql({username: "ausername", password: "apassword"});
      expect(dform).to.equal(aform);
    });

    it("projects changes in data", () => {
      var store, dform;

      var projector = (data, model) => {
        store = data;
        dform = model;
      };

      var aform = form({username: required(true)}, false, projector);
      aform.username("aname");

      expect(store).to.eql({username: "aname"});
      expect(dform).to.eql(aform);
    });

    it("does not project changes in data", () => {
      var store;

      var projector = (data) => {
        store = data;
      };

      var aform = form({username: required(true)}, false, projector);
      aform.username("aname", false);

      expect(store).to.eql(undefined);
    });

    describe(".isDirty()", () => {
      var aform = form({username: {default: 'ausername', validator: noop}});

      it("returns false if the value has not been altered", () => {
        expect(aform.username.isDirty()).to.equal(false);
      });

      it("returns true if the value has been altered", () => {
        aform.username('busername');
        expect(aform.username.isDirty()).to.equal(true);
      });

      it("works with array", () => {
        var aform = form({nums: {default: [1,2], validator: noop}});

        aform.nums([1,2])
        expect(aform.nums.isDirty()).to.equal(false);

        aform.nums([1,2,3])
        expect(aform.nums.isDirty()).to.equal(true);
      });
    });

    describe(".isValid()", () => {
      var aform;
      var config = {
        username: {default: 'batman',
                   validator: required(true)},
        password: {validator: function (value) {}}};

      beforeEach(() => {
        aform = form(config);
      });

      it("assigns error to .error attribute of itself too", () => {
        aform.username("");
        aform.username.isValid();
        expect(aform.username.error).to.exist;
      });

      it("empties the error field if valid value is supplied", function() {
        aform.username('spiderman');
        aform.username.isValid();
        expect(aform.error.username).not.to.exist;
      });

      it("returns true if the property is valid", () => {
        aform.username("batman");
        expect(aform.username.isValid()).to.equal(true);
      });

      it("returns false if the property is invalid", () => {
        aform.username("");
        expect(aform.username.isValid()).to.equal(false);
      });

      it("does not set the error if 'false' is passed", () => {
        aform.username("batman");
        aform.username.isValid();
        aform.username("");
        aform.username.isValid(false);
        expect(aform.username.error()).not.to.exist;
      });

      it("cleans the value before validation", () => {
        var aform = form({username: {default: "ausername",
                                     validator: function (value) {
                                       if (/^[^a][a-z]{1,8}$/.test(value)) {
                                         throw ValidationError("Error");
                                       }
                                     },
                                     cleaner: function (data) {
                                       return data.replace("a", "");
                                     }
                                    }
                        });
        expect(aform.username.isValid()).to.equal(true);
      });

      it("passes the value and entire form data to .validator", () => {
        var xvalue, xform;
        var aform = form({
          username: {
            validator: function (value, form) {
              xvalue = value;
              xform = form;
            }
          }
        });

        aform.username("flash");
        aform.username.isValid();
        expect(xvalue).to.equal("flash");
        expect(xform).to.eql({username: "flash"});
      });

      it("works even without validator key.", () => {
        var aform = form({
          username: required(true)
        });

        aform.username("auername");
        expect(aform.username.isValid()).to.equal(true);

        aform.username("");
        expect(aform.username.isValid()).to.equal(false);
      });

      it("works with multiple validators", () => {
        var aform = form({
          username: [required(true), isString()]
        });

        aform.username(1);
        expect(aform.username.isValid()).to.equal(false);
        aform.username("1");
        expect(aform.username.isValid()).to.equal(true);

        aform = form({
          username: {
            validator: [required(true), isString()]
          }
        });

        aform.username(1);
        expect(aform.username.isValid()).to.equal(false);
        aform.username("1");
        expect(aform.username.isValid()).to.equal(true);
      });

      it("attaches multiple errors", () => {
        var aform = form({
          username: {
            validator: [required(true), isString()]
          }
        }, true);

        aform.username(undefined);
        aform.username.isValid();
        expect(aform.username.error().length).to.equal(2);
      });

      it("return true if error is empty when multiple errors is turned on", () => {
        var aform = form({
          username: {
            validator: [required(true), isString()]
          }
        }, true);

        aform.username("a username");
        expect(aform.username.isValid()).to.equal(true);
      });
    });

    describe(".setAndValidate()", () => {
      var aform;
      beforeEach(() => {
        aform = form({username: {validator: required(true)}});
      });

      it("sets the value", () => {
        aform.username.setAndValidate("ausername");
        expect(aform.username()).to.equal("ausername");
      });

      it("validates the value", () => {
        aform.username.setAndValidate("");
        expect(aform.username.error).to.exist;
      });
    });

    describe(".reset()", () => {
      var aform;
      beforeEach(() => {
        aform = form({username: {validator: required(true), default: "baba"}});
      });

      it("resets the value", () => {
        aform.username("rara");
        aform.username.reset();
        expect(aform.username()).to.equal("baba");
      });

      it("empties its error", () => {
        aform.username("");
        aform.username.isValid();
        expect(aform.username.error()).to.exist;
        aform.username.reset();
        expect(aform.username.error()).not.to.exist;
      });

      it("projects changes", () => {
        var store;

        var projector = (data) => {
          store = data;
        };

        var bform = form({username: {validator: required(true), default: "baba"}}, false, projector);
        bform.username("mama");

        bform.reset();
        expect(store).to.eql({username: "baba"});
      });

      it("resets array", () => {
      	var data = [];
      	var aform = form({userList: {validator: required(true), default: []}});
      	data = aform.userList() || [];
      	data.push({name: "user"});
      	aform.userList(data);

      	aform.reset();
      	expect(aform.userList()).to.eql([]);
      });
    });

    describe(".error()", () => {
      var aform;
      beforeEach(() => {
        aform = form({username: {validator: required(true)}});
      });

      it("gets/sets the error", () => {
        aform.username.error("a error");
        expect(aform.username.error()).to.equal("a error");
      });

      it("can set 'undefined' as an error", () => {
        aform.username.error(undefined);
        expect(aform.username.error()).to.equal(undefined);
      });
    });
  });

  describe(".isValid()", () => {
    var aform;
    beforeEach(() => {
      aform = form({
        username: {validator: required(true)},
        password: {validator: required(true)}});
    });

    it("exists", () => {
      expect(aform.isValid).to.exist;
    });

    it("returns true if form is valid", () => {
      aform.username("ausername");
      aform.password("apassword");
      expect(aform.isValid()).to.equal(true);
    });

    it("returns false if form is invalid", () => {
      aform.username("");
      aform.password("apassword");
      expect(aform.isValid()).to.equal(false);
    });

    it("sets error if nothing is passed", () => {
      aform.username("");
      aform.password("apassword");
      aform.isValid();
      expect(aform.error()["username"]).to.exist;
      expect(aform.error()["password"]).not.to.exist;
    });

    it("does not change error if 'false' is passed", () => {
      aform.username("");
      aform.password("");
      aform.isValid(false);
      expect(aform.error()["username"]).not.to.exist;
      expect(aform.error()["password"]).not.to.exist;
    });

    it("sets each property's error to undefined if form validates", () => {
      aform.username("ausername");
      aform.username("apassword");
      aform.isValid();
      expect(aform.error()["username"]).not.to.exist;
      expect(aform.error()["apassword"]).not.to.exist;
    });

    it("it sets error on individual properties", () => {
      aform.username("");
      aform.password("hello");
      aform.isValid();
      expect(aform.username.error()).to.exist;
      expect(aform.password.error()).not.to.exist;
    });
  });

  describe(".isDirty()", () => {
    var aform = form({username: {validator: required(true), default: 'ausername'}});

    it("exists", () => {
      expect(aform.isDirty).to.exist;
    });

    it("returns false if form has not been altered", () => {
      expect(aform.isDirty()).to.equal(false);
    });

    it("returns true if form has been altered", () => {
      aform.username('busername');
      expect(aform.isDirty()).to.equal(true);
    });
  });

  describe(".setInitialValue", () => {
    it("sets initial state", () => {
      var aform = form({username: {default: "ausername", validator: required(true)}});
      expect(aform.username.isDirty()).to.equal(false);

      aform.username.setInitialValue("busername");
      expect(aform.username.isDirty()).to.equal(true);

      aform.username("ausername");
      aform.reset();
      expect(aform.username()).to.equal("busername");
    });

    it("works with array", () => {
      var aform = form({nums: {default: [1,2], validator: noop}});

      aform.nums.setInitialValue([1,2,3]);
      aform.nums([1,2,3]);
      expect(aform.nums.isDirty()).to.equal(false);

      aform.nums([1,2,3,4]);
      expect(aform.nums.isDirty()).to.equal(true);
    });
  });

  describe(".data()", () => {
    var aform;
    before(() => {
      aform = form({username: {default: 'ausername', validator: noop},
                    password: {default: 'apassword', validator: noop}});
    });

    it("returns the dict with key:value pair for each form field", () => {
      expect(aform.data()).to.eql({username: 'ausername', password: 'apassword'});
    });

    it("cleans the data if cleaner is present", () => {
      var cleaner = function (data) {
        return data.replace("a", "");
      };

      var aform = form({username: {default: 'ausername', cleaner: cleaner, validator: noop},
                        password: {default: 'apassword', cleaner: cleaner, validator: noop}});
      expect(aform.data()).to.eql({username: 'username', password: 'password'});
    });

    it("bulk assigns value", () => {
      var init = {
        task: "Meow meow",
        resolved: true
      };

      var aform = form({
        task () {},
        resolved () {}
      });

      aform.data(init);

      expect(aform.task()).to.equal(init.task);
      expect(aform.resolved()).to.equal(init.resolved);
    });

    it("sets new data as initial value of the form", () => {
      let newInitialData = {
        username: "busername",
        password: "bpassword"
      };

      aform.data(newInitialData, true);

      expect(aform.username.isDirty()).to.equal(false);
      expect(aform.isDirty()).to.equal(false);
    });
  });

  describe(".error()", () => {
    var aform;
    before(() => {
      aform = form({username: {default: 'ausername', validator: noop},
                    password: {default: 'apassword', validator: noop}});
    });

    it("sets error on each property", () => {
      aform.error({username: "a error"});
      expect(aform.username.error()).to.equal("a error");
      expect(aform.password.error()).not.to.exist;
    });

    it("sets single error if multiple error if false", () => {
      aform.error({username: ["a error"]});
      expect(aform.username.error()).to.equal("a error");
      expect(aform.password.error()).not.to.exist;
    });

    it("returns the error of each property", () => {
      var error = {username: "a error", password: "a error"};
      aform.error(error);
      expect(aform.error()).to.eql(error);
    });
  });

  describe(".reset()", () => {
    var aform;
    beforeEach(() => {
      aform = form({username: {validator: required(true), default: "ausername"},
                    password: {validator: required(true), default: "apassword"}});
    });

    it("resets value of each property", () => {
      aform.username("busername");
      aform.password("bpassword");
      aform.reset();
      expect(aform.username()).to.equal("ausername");
      expect(aform.password()).to.equal("apassword");
    });

    it("empties error on each property", () => {
      aform.username.error("a error");
      aform.password.error("b password");
      aform.reset();
      expect(aform.username.error()).not.to.exist;
      expect(aform.password.error()).not.to.exist;
    });
  });

  describe(".setInitialValue", () => {
    it("sets initial state of every field", () => {
      var aform = form({
        username: required(true),
        password: required(true)
      });
      expect(aform.isDirty()).to.equal(false);

      aform.setInitialValue({username: "ausername", password: "apassword"});
      expect(aform.isDirty()).to.equal(true);

      aform.data({username: "busername", password: "bpassword"});
      aform.reset();
      expect(aform.data()).to.eql({username: "ausername", password: "apassword"});
    });
  });

  describe("getUpdates", () => {
    it("returns updated key-value pairs", () => {
      var aform = form({
        username: required(true),
        password: required(true)
      });

      aform.data({username: "ausername", password: "apassword"}, true);

      expect(aform.getUpdates()).to.eql({});

      aform.username("busername");
      expect(aform.getUpdates()).to.eql({username: "busername"});
    });
  });
});
