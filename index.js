var some = require("lodash.some");
var every = require("lodash.every");
var keys = require("lodash.keys");
var foreach = require("lodash.foreach");


function isFunction(data) {
  return typeof data === "function";
}

function prop(model, field, defaultValue) {
  var initialState = defaultValue || "";
  var previousState = "";
  var state = model._config[field].modifier
      ? model._config[field].modifier(initialState, previousState)
      : initialState;

  var aclosure = function (value) {
    if(arguments.length === 0)  return state;

    previousState = state;
    state = model._config[field].modifier
      ? model._config[field].modifier(value, previousState )
      : value;
  };

  aclosure.isDirty = function() {
    return initialState !== state;
  };

  aclosure.setAndValidate = function (value) {
    aclosure(value);
    aclosure.isValid();
  };

  aclosure.isValid = function (attach_error) {
    var error, cleaner, value;
    cleaner = model._config[field].cleaner;
    value = cleaner? cleaner(aclosure()): aclosure();

    error = model._config[field].validator(value, model);
    if(attach_error !== false) {
      aclosure.error(error? error: undefined);
    }

    return error === undefined;
  };

  aclosure.reset = function () {
    aclosure(initialState);
    aclosure.error(undefined);
  };

  aclosure.error = function () {
    var state;
    return function (error) {
      if (arguments.length === 0) return state;
      state = error;
    };
  }();

  return aclosure;
}

module.exports =  function (config) {
  var formModel = {
    _config: config,
    isValid: function (attach_error) {
      var self = this;
      var truthPool = [];
      foreach(config, function (avalue, akey) {
        truthPool.push(self[akey].isValid(attach_error));
      });

      return every(truthPool, function (value) { return value === true;});
    },

    isDirty: function () {
      var self = this;
      return some(keys(this._config), function (akey) {
        return self[akey].isDirty();
      });
    },

    data: function () {
      var dict = {};
      var self = this;
      foreach(this._config, function (avalue, akey) {
        dict[akey] = avalue.cleaner? avalue.cleaner(self[akey]()): self[akey]();
      });

      return dict;
    },

    error: function (supplied_error) {
      var dict = {};
      var self = this;

      if (arguments.length === 0) {
        foreach(config, function (avalue, akey) {
          dict[akey] = self[akey].error();
        });
        return dict;
      }
      else {
        foreach(config, function (avalue, akey) {
          self[akey].error(supplied_error[akey]? supplied_error[akey]: undefined);
        });
      };
    },

    reset: function () {
      foreach(config, function (avalue, akey) {
        formModel[akey].reset();
        formModel[akey].error(undefined);
      });
    }
  };

  foreach(config, function (avalue, akey) {
    if (!isFunction(avalue.validator)) throw error("'" + akey + "' needs a validator.");
    formModel[akey] = prop(formModel, akey, avalue.default);
  });

  return formModel;
};
