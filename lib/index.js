'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _validatex = require('validatex');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var STOP_VALIDATION_ERROR_NAME = 'StopValidationError';

var StopValidationError = function (_Error) {
  _inherits(StopValidationError, _Error);

  function StopValidationError() {
    _classCallCheck(this, StopValidationError);

    var _this = _possibleConstructorReturn(this, (StopValidationError.__proto__ || Object.getPrototypeOf(StopValidationError)).call(this));

    _this.name = STOP_VALIDATION_ERROR_NAME;
    return _this;
  }

  return StopValidationError;
}(Error);

var clone = function clone(data) {
  if (!data) return data;
  return JSON.parse(JSON.stringify(data));
};

var cloneObj = function cloneObj(obj) {
  var clonedObj = {};
  for (var key in obj) {
    clonedObj[key] = obj[key];
  }
  return clonedObj;
};

var isEqual = function isEqual(val1, val2) {
  return JSON.stringify(val1) === JSON.stringify(val2);
};

var Field = function () {
  function Field(validator) {
    _classCallCheck(this, Field);

    // its an object
    if (validator.validator) {
      var clonedValidator = cloneObj(validator);
      this.validator = clonedValidator.validator;
      delete clonedValidator.validator;
      this.config = clonedValidator;
    }
    // its a function
    else {
        this.validator = validator;
        this.config = {};
      }

    this.error = undefined;
    this.previousValue = undefined;
    this.currentValue = undefined;
    this.initialValue = undefined;
    this.defaultValue = this.initialValue = this.config.default === undefined || this.config.default === null ? undefined : clone(this.config.default);
    // will call onChange callback if exists
    this.setData(this.defaultValue, true);
    this.makePrestine();
  }

  _createClass(Field, [{
    key: 'clean',
    value: function clean(newVal) {
      var clean = this.config.clean;
      if (clean) {
        return clean(newVal);
      }

      return newVal;
    }
  }, {
    key: 'modify',
    value: function modify(newVal, preVal) {
      var modify = this.config.modify;
      if (modify) {
        return modify(newVal, preVal);
      }
      return newVal;
    }
  }, {
    key: 'triggerOnError',
    value: function triggerOnError() {
      var callback = this.config.onError;
      callback && callback(clone(this.getError()), this);

      if (this.parent) this.parent.triggerOnError();
    }
  }, {
    key: 'triggerOnChange',
    value: function triggerOnChange() {
      var callback = this.config.onChange;
      callback && callback(clone(this.currentValue), this);

      this.parent && this.parent.triggerOnChange();
    }
  }, {
    key: 'setData',
    value: function setData(value, skipTrigger) {
      if (isEqual(this.currentValue, value)) return;
      this.previousValue = clone(this.currentValue);

      this.currentValue = this.modify(clone(value), clone(this.previousValue));

      if (skipTrigger) return;
      var debounce = this.config.debounce;
      if (debounce) {
        this.timer && clearTimeout(this.timer);
        this.timer = setTimeout(this.triggerOnChange.bind(this), debounce);
      } else {
        this.triggerOnChange();
      }
    }
  }, {
    key: 'getData',
    value: function getData() {
      return clone(this.currentValue);
    }
  }, {
    key: 'getCleanData',
    value: function getCleanData() {
      return this.clean(this.getData());
    }
  }, {
    key: 'validate',
    value: function validate() {
      var error = (0, _validatex.validateSingle)(this.currentValue, this.validator, this.multipleErrors, this.parent.getData(), this.fieldName);
      this.setError(error);
      return error;
    }
  }, {
    key: 'isValid',
    value: function isValid() {
      var error = (0, _validatex.validateSingle)(this.currentValue, this.validator, this.multipleErrors, this.parent.getData(), this.fieldName);
      return !error;
    }
  }, {
    key: 'setError',
    value: function setError(error, skipTrigger) {
      if (this.error === error) return;
      this.error = error || undefined;

      if (skipTrigger) return;
      this.triggerOnError();
    }
  }, {
    key: 'getError',
    value: function getError() {
      return this.error;
    }
  }, {
    key: 'isDirty',
    value: function isDirty() {
      return this.previousValue !== this.currentValue;
    }
  }, {
    key: 'makePrestine',
    value: function makePrestine() {
      this.previousValue = clone(this.currentValue);
      this.initialValue = clone(this.currentValue);
      this.setError(undefined);
    }
  }, {
    key: 'makePristine',
    value: function makePristine() {
      this.makePrestine();
    }
  }, {
    key: 'reset',
    value: function reset() {
      this.setData(clone(this.initialValue));
      this.makePristine();
    }
  }, {
    key: 'setAndValidate',
    value: function setAndValidate(value) {
      this.setData(value);
      this.isValid();
      return this.getError();
    }
  }]);

  return Field;
}();

var Form = function () {
  function Form() {
    _classCallCheck(this, Form);
  }

  _createClass(Form, [{
    key: 'toggleGetNotified',
    value: function toggleGetNotified() {
      this.getNotified = !this.getNotified;
    }
  }, {
    key: 'setData',
    value: function setData(data, skipTrigger) {
      this.toggleGetNotified();
      for (var prop in data) {
        if (this.fieldNames.indexOf(prop) !== -1) {
          this[prop].setData(data[prop], skipTrigger);
        }
      }
      this.toggleGetNotified();
      if (skipTrigger) return;
      this.triggerOnChange();
    }
  }, {
    key: 'triggerOnChange',
    value: function triggerOnChange() {
      var callback = this.config.onChange;
      this.getNotified && callback && callback(this.getData(), this);
    }
  }, {
    key: 'triggerOnError',
    value: function triggerOnError() {
      var callback = this.config.onError;
      this.getNotified && callback && callback(this.getError(), this);
    }
  }, {
    key: 'getData',
    value: function getData() {
      var _this2 = this;

      return this.fieldNames.reduce(function (acc, fieldName) {
        acc[fieldName] = _this2[fieldName].getCleanData();
        return acc;
      }, {});
    }
  }, {
    key: 'getUpdates',
    value: function getUpdates() {
      var _this3 = this;

      return this.fieldNames.reduce(function (acc, fieldName) {
        if (_this3[fieldName].isDirty()) {
          acc[fieldName] = _this3[fieldName].getData();
        }
        return acc;
      }, {});
    }
  }, {
    key: 'setError',
    value: function setError(errors, skipTrigger) {
      this.toggleGetNotified();
      for (var field in errors) {
        if (this.fieldNames.indexOf(field) !== -1) {
          this[field].setError(errors[field], skipTrigger);
        }
      }
      this.toggleGetNotified();

      if (skipTrigger) return;
      this.triggerOnError();
    }
  }, {
    key: 'getError',
    value: function getError() {
      var _this4 = this;

      return this.fieldNames.reduce(function (acc, fieldName) {
        acc[fieldName] = _this4[fieldName].getError();
        return acc;
      }, {});
    }
  }, {
    key: 'isDirty',
    value: function isDirty() {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.fieldNames[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var field = _step.value;

          if (this[field].isDirty()) return true;
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return false;
    }
  }, {
    key: 'makePrestine',
    value: function makePrestine() {
      var _this5 = this;

      this.toggleGetNotified();
      this.fieldNames.forEach(function (field) {
        _this5[field].makePrestine();
      });
      this.toggleGetNotified();
      this.triggerOnError();
    }
  }, {
    key: 'makePristine',
    value: function makePristine() {
      this.makePrestine();
    }
  }, {
    key: 'reset',
    value: function reset() {
      var _this6 = this;

      this.toggleGetNotified();
      this.fieldNames.forEach(function (field) {
        _this6[field].reset();
      });
      this.toggleGetNotified();
      this.triggerOnError();
      this.triggerOnChange();
    }
  }, {
    key: 'isValid',
    value: function isValid(skipAttachError) {
      var _this7 = this;

      var status = void 0;
      this.toggleGetNotified();

      try {
        status = this.fieldNames.reduce(function (acc, field) {
          var validity = _this7[field].isValid(skipAttachError);
          if (!validity && _this7.config.stopOnError) {
            throw new StopValidationError();
          }
          return validity && acc;
        }, true);
      } catch (err) {
        if (err.name === STOP_VALIDATION_ERROR_NAME) {
          status = false;
        } else {
          throw err;
        }
      }

      this.toggleGetNotified();
      !skipAttachError && this.triggerOnError();
      return status;
    }
  }]);

  return Form;
}();

function powerform(fields) {
  var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var form = new Form();
  form.fieldNames = [];
  form.config = config;
  form.getNotified = true;

  for (var fieldName in fields) {
    var field = new Field(fields[fieldName]);
    var index = field.index;
    field.parent = form;
    field.fieldName = fieldName;
    field.multipleErrors = form.config.multipleErrors || false;
    form[fieldName] = field;

    if (index) {
      form.fieldNames[index] = fieldName;
    } else {
      form.fieldNames.push(fieldName);
    }
  }

  config.data && form.setData(config.data, true);
  return form;
}

module.exports = {
  Form: Form,
  Field: Field,
  powerform: powerform
};