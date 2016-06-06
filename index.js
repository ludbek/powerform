var validate = require('validate.js');
var _ = {
  some: require('lodash/some.js'),
  every: require('lodash/every.js'),
  keys: require('lodash/keys.js'),
  omit: require('lodash/omit.js'),
  forEach: require('lodash/forEach.js')
};

function prop(model, field, defaultValue) {
  var initialState = defaultValue || "";
  var previousState = initialState;
  var state = model._config[field].decorator
      ? model._config[field].decorator(initialState, previousState)
      : initialState;

  var aclosure = function (value) {
    if(arguments.length === 0)  return state;

    previousState = state;
    state = model._config[field].decorator
      ? model._config[field].decorator(value, previousState )
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
    var errors;
    var constrains = {};
    constrains[field] = _.omit(model._config[field], ['default', 'decorator', 'cleaner']);
    var values = {};
    values[field] = aclosure();

    // for equality
    if (model._config[field].equality) {
      var equalAgainst = model._config[field].equality;
      values[equalAgainst] = model[equalAgainst]();
      }

    errors = validate(values, constrains);
    if(attach_errors !== false) {
      aclosure.errors(errors? errors[field]: undefined);
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
    formModel[akey] = prop(formModel, akey, avalue.default);
  });

  return formModel;
};
