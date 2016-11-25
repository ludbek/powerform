import some from "lodash/some.js";
import every from "lodash/every.js";
import keys from "lodash/keys.js";
import forEach from "lodash/forEach.js";
import {validateSingle} from "validatex";


let isFunction = (data) => {
  return typeof data === "function";
};

let isArray = (data) => {
  return data instanceof Array;
};

let isValidValidator = (validator) => {
  return isFunction(validator) || isArray(validator);
};

function prop(model, field, defaultValue, multipleErrors, projector) {
  let initialState = defaultValue || "";
  let previousState = "";
  let state = model._config[field].modifier
      ? model._config[field].modifier(initialState, previousState)
      : initialState;

  let aclosure = function (value, doProject) {
    if(arguments.length === 0) return state;

    var stateChanged = state !== value;

    previousState = state;
    state = model._config[field].modifier
      ? model._config[field].modifier(value, previousState)
      : value;

    let field_projector = model._config[field].projector;
    if (field_projector && stateChanged && doProject !== false) {
      field_projector(value, model.data());
    }

    if (!field_projector && projector && stateChanged && doProject !== false) {
      projector(model.data());
    }
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
    let config = model._config[field];
    cleaner = config.cleaner;
    value = cleaner? cleaner(aclosure()): aclosure();

    let validator = isFunction(config) || isArray(config)
      ? config
      : config.validator

    error = validateSingle(value, validator, multipleErrors, model.data(), field);

    if(attach_error !== false) {
      aclosure.error(error? error: undefined);
    }

    return error === undefined;
  };

  aclosure.reset = (doProject) => {
    doProject === false? aclosure(initialState, false): aclosure(initialState);
    aclosure.error(undefined);
  };

  aclosure.error = function () {
    var state;
    return function (error) {
      if (arguments.length === 0) return state;
      state = error;
    };
  }();

  aclosure.setInitialValue = function (value) {
    initialState = value;
  };

  return aclosure;
}

module.exports =  function (config, multipleErrors = false, projector) {
  let formModel = {
    _config: config,
    isValid (attach_error) {
      var truthPool = [];
      forEach(config, (avalue, akey) => {
        truthPool.push(this[akey].isValid(attach_error));
      });

      return every(truthPool, (value) => { return value === true;});
    },

    isDirty () {
      return some(keys(this._config), (akey) => {
        return this[akey].isDirty();
      });
    },

    data (init, setAsInitialValue) {
      if (init) {
        forEach(init, (value, key) => {
          if (this._config[key]) {
            this[key](value, false);
            setAsInitialValue && this[key].setInitialValue(value);
          }
        });

        projector && projector(this.data());
      }
      else {
        var dict = {};
        forEach(this._config, (avalue, akey) => {
          dict[akey] = avalue.cleaner? avalue.cleaner(this[akey]()): this[akey]();
        });

        return dict;
      }
    },

    setInitialValue (data) {
      forEach(this._config, (value, key) => {
        this[key].setInitialValue(data[key]);
      })
    },

    error (supplied_error) {
      var dict = {};

      if (arguments.length === 0) {
        forEach(config, (avalue, akey) => {
          dict[akey] = this[akey].error();
        });
        return dict;
      }
      else {
        forEach(config, (avalue, akey) => {
          this[akey].error(supplied_error[akey]? supplied_error[akey]: undefined);
        });
      };
    },

    reset () {
      forEach(config, (avalue, akey) => {
        formModel[akey].reset(false);
        formModel[akey].error(undefined);
      });

      projector && projector(this.data());
    },

    getUpdates () {
      var dict = {};
      forEach(this._config, (avalue, akey) => {
        if (this[akey].isDirty()) {
          dict[akey] = avalue.cleaner? avalue.cleaner(this[akey]()): this[akey]();
        }
      });

      return dict;
    }
  };

  forEach(config, (avalue, akey) => {
    if (!isValidValidator(avalue) && !isValidValidator(avalue.validator)) {
      throw Error("'" + akey + "' needs a validator.");
    }
    formModel[akey] = prop(formModel, akey, avalue.default, multipleErrors, projector);
  });

  return formModel;
};
