import some from "lodash/some.js";
import every from "lodash/every.js";
import keys from "lodash/keys.js";
import forEach from "lodash/forEach.js";

var _ = {some, every, keys, forEach};


let isFunction = (data) => {
  return typeof data === "function";
};

function prop(model, field, defaultValue) {
  let initialState = defaultValue || "";
  let previousState = "";
  let state = model._config[field].modifier
      ? model._config[field].modifier(initialState, previousState)
      : initialState;

  let aclosure = function (value) {
    if(arguments.length === 0)  return state;

    previousState = state;
    state = model._config[field].modifier
      ? model._config[field].modifier(value, previousState )
      : value;
  };

  aclosure.isDirty = () => {
    return initialState !== state;
  };

  aclosure.setAndValidate = (value) => {
    aclosure(value);
    aclosure.isValid();
  };

  aclosure.isValid = (attach_error) => {
    let error, cleaner, value;
    cleaner = model._config[field].cleaner;
    value = cleaner? cleaner(aclosure()): aclosure();

    if (model._config[field].required === false && !value) {
      return true;
    }

    if (isFunction(model._config[field])) {
      error = model._config[field](value, model);
    }
    else {
      error = model._config[field].validator(value, model);
    }
    if(attach_error !== false) {
      aclosure.error(error? error: undefined);
    }

    return error === undefined;
  };

  aclosure.reset = () => {
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
  let formModel = {
    _config: config,
    isValid (attach_error) {
      var truthPool = [];
      _.forEach(config, (avalue, akey) => {
        truthPool.push(this[akey].isValid(attach_error));
      });

      return _.every(truthPool, (value) => { return value === true;});
    },

    isDirty () {
      return _.some(_.keys(this._config), (akey) => {
        return this[akey].isDirty();
      });
    },

    data () {
      var dict = {};
      _.forEach(this._config, (avalue, akey) => {
        dict[akey] = avalue.cleaner? avalue.cleaner(this[akey]()): this[akey]();
      });

      return dict;
    },

    error (supplied_error) {
      var dict = {};

      if (arguments.length === 0) {
        _.forEach(config, (avalue, akey) => {
          dict[akey] = this[akey].error();
        });
        return dict;
      }
      else {
        _.forEach(config, (avalue, akey) => {
          this[akey].error(supplied_error[akey]? supplied_error[akey]: undefined);
        });
      };
    },

    reset () {
      _.forEach(config, (avalue, akey) => {
        formModel[akey].reset();
        formModel[akey].error(undefined);
      });
    }
  };

  _.forEach(config, (avalue, akey) => {
    if (!isFunction(avalue) && !isFunction(avalue.validator)) {
      throw Error("'" + akey + "' needs a validator.");
    }
    formModel[akey] = prop(formModel, akey, avalue.default);
  });

  return formModel;
};
