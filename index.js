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

let clone = (data) => {
  return JSON.parse(JSON.stringify(data));
};

function prop(model, field, defaultValue = null, multipleErrors, projector) {
  defaultValue = typeof(defaultValue) === 'undefined' ? null : defaultValue;
  let initialState = defaultValue;
  let previousState = null;
  let state = model._config[field].modifier
      ? model._config[field].modifier(clone(initialState), previousState)
      : clone(initialState);

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
    return JSON.stringify(initialState) !== JSON.stringify(state);
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

    return error === undefined || (multipleErrors && error.length === 0);
  };

  aclosure.reset = (doProject) => {
    doProject === false? aclosure(initialState, false): aclosure(initialState);
    aclosure.error(undefined);
  };

  aclosure.error = function () {
    var state;
    return function (error) {
      if (arguments.length === 0) return state;
      if (!multipleErrors && isArray(error) && error.length > 0) {
        state = error[0];
      }
      else {
        state = error;
      }
    };
  }();

  aclosure.setInitialValue = function (value) {
    initialState = clone(value);
  };

  return aclosure;
}

module.exports =  function (config, multipleErrors = false, projector) {
  let formModel = {
    _config: config,
    isValid (attach_error) {
      let truthPool = Object.keys(config).reduce((pool, key) => {
        pool.push(this[key].isValid(attach_error));
        return pool;
      }, []);

      return truthPool.every((value) => { return value === true;});
    },

    isDirty () {
      return Object.keys(config).some((akey) => {
        return this[akey].isDirty();
      });
    },

    data (init, setAsInitialValue) {
      if (init) {
        Object.keys(init).forEach((key) => {
          let value = init[key];
          if (config[key]) {
            let field = this[key];
            field(value, false);
            setAsInitialValue && field.setInitialValue(value);
          }
        });

        projector && projector(this.data());
      }
      else {
        return Object.keys(config).reduce((data, key) => {
          let cleaner = config[key].cleaner;
          let value = this[key]();
          data[key] = cleaner? cleaner(value): value;
          return data;
        }, {});
      }
    },

    setInitialValue (data) {
      Object.keys(config).forEach((key) => {
        this[key].setInitialValue(data[key]);
      });
    },

    error (supplied_error) {
      var dict = {};

      if (arguments.length === 0) {
        return Object.keys(config).reduce((error, key) => {
          error[key] = this[key].error();
          return error;
        }, {});
      }
      else {
        Object.keys(config).forEach((key) => {
          this[key].error(supplied_error[key]? supplied_error[key]: undefined);
        });
      };
    },

    reset () {
      Object.keys(config).forEach((key) => {
        this[key].reset(false);
        this[key].error(undefined);
      });

      projector && projector(this.data());
    },

    getUpdates () {
      return Object.keys(config).reduce((updates, key) => {
        if (this[key].isDirty()) {
          let cleaner = config[key].cleaner;
          let value = this[key]();

          updates[key] = cleaner? cleaner(value): value;
        }
        return updates;
      }, {});
    }
  };

  Object.keys(config).forEach((key) => {
    let field = config[key];
    if (!isValidValidator(field) && !isValidValidator(field.validator)) {
      throw Error("'" + key + "' needs a validator.");
    }
    formModel[key] = prop(formModel, key, field.default, multipleErrors, projector);
  });

  return formModel;
};
