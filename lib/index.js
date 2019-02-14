"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function StopValidationError() {
  this.stack = new Error().stack;
}

function ValidationError(msg) {
  this.message = msg;
  this.stack = new Error(msg).stack;
}

var clone = function clone(data) {
  if (!data) return data;
  return JSON.parse(JSON.stringify(data));
};

var isEqual = function isEqual(val1, val2) {
  return JSON.stringify(val1) === JSON.stringify(val2);
};

var Field = function () {
  function Field() {
    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Field);

    this.error = undefined;
    this.previousValue = undefined;
    this.currentValue = undefined;
    this.initialValue = undefined;

    this.config = config;
    this.defaultValue = this.initialValue = !config || config.default === undefined || config.default === null ? undefined : clone(config.default);
    // will call onChange callback if exists
    this.setData(this.defaultValue, true);
    this.makePrestine();
  }

  _createClass(Field, [{
    key: "clean",
    value: function clean(newVal) {
      return newVal;
    }
  }, {
    key: "modify",
    value: function modify(newVal, preVal) {
      return newVal;
    }
  }, {
    key: "triggerOnError",
    value: function triggerOnError() {
      var callback = this.config.onError;
      callback && callback(clone(this.getError()), this);

      if (this.parent) this.parent.triggerOnError();
    }
  }, {
    key: "triggerOnChange",
    value: function triggerOnChange() {
      var callback = this.config.onChange;
      callback && callback(clone(this.currentValue), this);

      this.parent && this.parent.triggerOnChange();
    }
  }, {
    key: "setData",
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
    key: "getData",
    value: function getData() {
      return clone(this.currentValue);
    }
  }, {
    key: "getCleanData",
    value: function getCleanData() {
      return this.clean(this.getData());
    }
  }, {
    key: "isValid",
    value: function isValid(skipAttachError) {
      var error = void 0;
      try {
        this.validate(this.currentValue, this.parent && this.parent.getData(), this.fieldName);
        error = undefined;
      } catch (err) {
        if (err instanceof ValidationError) {
          error = err.message;
        } else {
          throw err;
        }
      }
      !skipAttachError && this.setError(error);
      return !error;
    }
  }, {
    key: "setError",
    value: function setError(error, skipTrigger) {
      if (this.error === error) return;
      this.error = error || undefined;

      if (skipTrigger) return;
      this.triggerOnError();
    }
  }, {
    key: "getError",
    value: function getError() {
      return this.error;
    }
  }, {
    key: "isDirty",
    value: function isDirty() {
      return this.previousValue !== this.currentValue;
    }
  }, {
    key: "makePrestine",
    value: function makePrestine() {
      this.previousValue = clone(this.currentValue);
      this.initialValue = clone(this.currentValue);
      this.setError(undefined);
    }
  }, {
    key: "makePristine",
    value: function makePristine() {
      this.makePrestine();
    }
  }, {
    key: "reset",
    value: function reset() {
      this.setData(clone(this.initialValue));
      this.makePristine();
    }
  }, {
    key: "setAndValidate",
    value: function setAndValidate(value) {
      this.setData(value);
      this.isValid();
      return this.getError();
    }
  }], [{
    key: "new",
    value: function _new(config) {
      return new this(config);
    }
  }]);

  return Field;
}();

var Form = function () {
  function Form() {
    _classCallCheck(this, Form);
  }

  _createClass(Form, [{
    key: "toggleGetNotified",
    value: function toggleGetNotified() {
      this.getNotified = !this.getNotified;
    }
  }, {
    key: "setData",
    value: function setData(data, skipTrigger) {
      this.toggleGetNotified();
      for (var prop in data) {
        if (this._fields.indexOf(prop) !== -1) {
          this[prop].setData(data[prop], skipTrigger);
        }
      }
      this.toggleGetNotified();
      if (skipTrigger) return;
      this.triggerOnChange();
    }
  }, {
    key: "triggerOnChange",
    value: function triggerOnChange() {
      var callback = this.config.onChange;
      this.getNotified && callback && callback(this.getData(), this);
    }
  }, {
    key: "triggerOnError",
    value: function triggerOnError() {
      var callback = this.config.onError;
      this.getNotified && callback && callback(this.getError(), this);
    }
  }, {
    key: "getData",
    value: function getData() {
      var _this = this;

      return this._fields.reduce(function (acc, fieldName) {
        acc[fieldName] = _this[fieldName].getCleanData();
        return acc;
      }, {});
    }
  }, {
    key: "getUpdates",
    value: function getUpdates() {
      var _this2 = this;

      return this._fields.reduce(function (acc, fieldName) {
        if (_this2[fieldName].isDirty()) {
          acc[fieldName] = _this2[fieldName].getData();
        }
        return acc;
      }, {});
    }
  }, {
    key: "setError",
    value: function setError(errors, skipTrigger) {
      this.toggleGetNotified();
      for (var field in errors) {
        if (this._fields.indexOf(field) !== -1) {
          this[field].setError(errors[field], skipTrigger);
        }
      }
      this.toggleGetNotified();

      if (skipTrigger) return;
      this.triggerOnError();
    }
  }, {
    key: "getError",
    value: function getError() {
      var _this3 = this;

      return this._fields.reduce(function (acc, fieldName) {
        acc[fieldName] = _this3[fieldName].getError();
        return acc;
      }, {});
    }
  }, {
    key: "isDirty",
    value: function isDirty() {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this._fields[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
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
    key: "makePrestine",
    value: function makePrestine() {
      var _this4 = this;

      this.toggleGetNotified();
      this._fields.forEach(function (field) {
        _this4[field].makePrestine();
      });
      this.toggleGetNotified();
      this.triggerOnError();
    }
  }, {
    key: "makePristine",
    value: function makePristine() {
      this.makePrestine();
    }
  }, {
    key: "reset",
    value: function reset() {
      var _this5 = this;

      this.toggleGetNotified();
      this._fields.forEach(function (field) {
        _this5[field].reset();
      });
      this.toggleGetNotified();
      this.triggerOnError();
      this.triggerOnChange();
    }
  }, {
    key: "isValid",
    value: function isValid(skipAttachError) {
      var _this6 = this;

      var status = void 0;
      this.toggleGetNotified();

      try {
        status = this._fields.reduce(function (acc, field) {
          var validity = _this6[field].isValid(skipAttachError);
          if (!validity && _this6.config.stopOnError) {
            throw new StopValidationError();
          }
          return validity && acc;
        }, true);
      } catch (err) {
        if (err instanceof StopValidationError) {
          status = false;
        } else {
          throw err;
        }
      }

      this.toggleGetNotified();
      !skipAttachError && this.triggerOnError();
      return status;
    }
  }], [{
    key: "new",
    value: function _new() {
      var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var form = new this();
      form._fields = [];
      form.config = config;
      form.getNotified = true;

      for (var fieldName in form) {
        var field = form[fieldName];
        var index = field.index;
        if (field instanceof Field) {
          field.parent = form;
          field.fieldName = fieldName;

          if (index) {
            form._fields[index] = fieldName;
          } else {
            form._fields.push(fieldName);
          }
        }
      }

      config.data && form.setData(config.data, true);
      return form;
    }
  }]);

  return Form;
}();

module.exports = {
  Form: Form,
  Field: Field,
  ValidationError: ValidationError
};