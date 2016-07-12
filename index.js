var _ = {
  some: require('lodash/some.js'),
  every: require('lodash/every.js'),
  keys: require('lodash/keys.js'),
  omit: require('lodash/omit.js'),
  forEach: require('lodash/forEach.js')
};

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

  aclosure.isValid = function (attach_errors) {
    var errors, cleaner, value;
    cleaner = model._config[field].cleaner;
    value = cleaner? cleaner(aclosure()): aclosure();

    errors = model._config[field].validator(value);
    if(attach_errors !== false) {
      aclosure.errors(errors? errors: undefined);
    }

    return errors === undefined;
  };

  aclosure.reset = function () {
    aclosure(initialState);
    aclosure.errors(undefined);
  };

  aclosure.errors = function () {
    var state;
    return function (errors) {
      if (arguments.length === 0) return state;
      state = errors;
    };
  }();

  return aclosure;
}

module.exports =  function (config) {
  var formModel = {
    _config: config,
    isValid: function (attach_errors) {
      var self = this;
      var truthPool = [];
      _.forEach(config, function (avalue, akey) {
        truthPool.push(self[akey].isValid(attach_errors));
      });

      return _.every(truthPool, function (value) { return value === true;});
    },

    isDirty: function () {
      var self = this;
      return _.some(_.keys(this._config), function (akey) {
        return self[akey].isDirty();
      });
    },

    data: function () {
      var dict = {};
      var self = this;
      _.forEach(this._config, function (avalue, akey) {
        dict[akey] = avalue.cleaner? avalue.cleaner(self[akey]()): self[akey]();
      });

      return dict;
    },

    errors: function (supplied_errors) {
      var dict = {};
      var self = this;

      if (arguments.length === 0) {
        _.forEach(config, function (avalue, akey) {
          dict[akey] = self[akey].errors();
        });
        return dict;
      }
      else {
        _.forEach(config, function (avalue, akey) {
          self[akey].errors(supplied_errors[akey]? supplied_errors[akey]: undefined);
        });
      };
    },

    reset: function () {
      _.forEach(config, function (avalue, akey) {
        formModel[akey].reset();
        formModel[akey].errors(undefined);
      });
    }
  };

  _.forEach(config, function (avalue, akey) {
    if (!isFunction(avalue.validator)) throw Error("'" + akey + "' needs a validator.");
    formModel[akey] = prop(formModel, akey, avalue.default);
  });

  return formModel;
};
