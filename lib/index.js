"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.powerform = exports.defaultConfig = exports.Form = exports.Field = void 0;
var STOP_VALIDATION_ERROR_NAME = "StopValidationError";
var StopValidationError = /** @class */ (function (_super) {
    __extends(StopValidationError, _super);
    function StopValidationError() {
        var _this = _super.call(this) || this;
        _this.name = STOP_VALIDATION_ERROR_NAME;
        return _this;
    }
    return StopValidationError;
}(Error));
var isEqual = function (val1, val2) {
    return JSON.stringify(val1) === JSON.stringify(val2);
};
var Field = /** @class */ (function () {
    function Field(validator, initialValue, fieldName, parent) {
        this.validator = validator;
        this.initialValue = initialValue;
        this.fieldName = fieldName;
        this.parent = parent;
        this.validator = validator;
        this.error = "";
        this.currentValue = this.previousValue = this.initialValue;
        this.setData(this.initialValue, true);
        this.makePristine();
    }
    Field.prototype.triggerOnError = function () {
        if (this.parent)
            this.parent.triggerOnError();
    };
    Field.prototype.triggerOnChange = function () {
        this.parent && this.parent.triggerOnChange();
    };
    Field.prototype.setData = function (value, skipTrigger) {
        if (isEqual(this.currentValue, value))
            return;
        this.previousValue = this.currentValue;
        if (skipTrigger)
            return;
        this.triggerOnChange();
    };
    Field.prototype.getData = function () {
        return this.currentValue;
    };
    Field.prototype.validate = function () {
        var _a = this.validator(this.currentValue, {
            prevValue: this.previousValue,
            fieldName: this.fieldName,
            all: this.parent.getData()
        }), _ = _a[0], err = _a[1];
        this.setError(err);
        return !Boolean(err);
    };
    Field.prototype.isValid = function () {
        var _a = this.validator(this.currentValue, {
            prevValue: this.previousValue,
            fieldName: this.fieldName,
            all: this.parent.getData()
        }), _ = _a[0], err = _a[1];
        return !Boolean(err);
    };
    Field.prototype.setError = function (error, skipTrigger) {
        if (this.error === error)
            return;
        this.error = error;
        if (skipTrigger)
            return;
        this.triggerOnError();
    };
    Field.prototype.getError = function () {
        return this.error;
    };
    Field.prototype.isDirty = function () {
        return this.previousValue !== this.currentValue;
    };
    Field.prototype.makePristine = function () {
        this.initialValue = this.previousValue = this.currentValue;
        this.setError("");
    };
    Field.prototype.reset = function () {
        this.setData(this.initialValue);
        this.makePristine();
    };
    Field.prototype.setAndValidate = function (value) {
        this.setData(value);
        this.validate();
        return this.getError();
    };
    return Field;
}());
exports.Field = Field;
var Form = /** @class */ (function () {
    function Form(config) {
        this.config = config;
        this.getNotified = true;
    }
    Form.prototype.toggleGetNotified = function () {
        this.getNotified = !this.getNotified;
    };
    Form.prototype.setData = function (data, skipTrigger) {
        this.toggleGetNotified();
        var prop;
        for (prop in data) {
            this.fields[prop].setData(data[prop], skipTrigger);
        }
        this.toggleGetNotified();
        if (skipTrigger)
            return;
        this.triggerOnChange();
    };
    Form.prototype.triggerOnChange = function () {
        var callback = this.config.onChange;
        this.getNotified && callback && callback(this.getData(), this);
    };
    Form.prototype.triggerOnError = function () {
        var callback = this.config.onError;
        this.getNotified && callback && callback(this.getError(), this);
    };
    Form.prototype.getData = function () {
        var data = {};
        var fieldName;
        for (fieldName in this.fields) {
            data[fieldName] = this.fields[fieldName].getData();
        }
        return data;
    };
    Form.prototype.getUpdates = function () {
        var data = {};
        var fieldName;
        for (fieldName in this.fields) {
            if (this.fields[fieldName].isDirty()) {
                data[fieldName] = this.fields[fieldName].getData();
            }
        }
        return data;
    };
    Form.prototype.setError = function (errors, skipTrigger) {
        this.toggleGetNotified();
        var prop;
        for (prop in errors) {
            this.fields[prop].setError(errors[prop], skipTrigger);
        }
        this.toggleGetNotified();
        if (skipTrigger)
            return;
        this.triggerOnError();
    };
    Form.prototype.getError = function () {
        var errors = {};
        var fieldName;
        for (fieldName in this.fields) {
            errors[fieldName] = this.fields[fieldName].getError();
        }
        return errors;
    };
    Form.prototype.isDirty = function () {
        var fieldName;
        for (fieldName in this.fields) {
            if (this.fields[fieldName].isDirty())
                return true;
        }
        return false;
    };
    Form.prototype.makePristine = function () {
        this.toggleGetNotified();
        var fieldName;
        for (fieldName in this.fields) {
            this.fields[fieldName].makePristine();
        }
        this.toggleGetNotified();
        this.triggerOnError();
    };
    Form.prototype.reset = function () {
        this.toggleGetNotified();
        var fieldName;
        for (fieldName in this.fields) {
            this.fields[fieldName].reset();
        }
        this.toggleGetNotified();
        this.triggerOnError();
        this.triggerOnChange();
    };
    Form.prototype._validate = function (skipAttachError) {
        var status = true;
        this.toggleGetNotified();
        try {
            var fieldName = void 0;
            for (fieldName in this.fields) {
                var validity = void 0;
                if (skipAttachError) {
                    validity = this.fields[fieldName].isValid();
                }
                else {
                    validity = this.fields[fieldName].validate();
                }
                if (!validity && this.config.stopOnError) {
                    throw new StopValidationError();
                }
                status = validity && status;
            }
        }
        catch (err) {
            if (err instanceof StopValidationError) {
                status = false;
            }
            else {
                throw err;
            }
        }
        this.toggleGetNotified();
        return status;
    };
    Form.prototype.validate = function () {
        var validity = this._validate(false);
        this.triggerOnError();
        return validity;
    };
    Form.prototype.isValid = function () {
        return this._validate(true);
    };
    return Form;
}());
exports.Form = Form;
exports.defaultConfig = {
    multipleErrors: false,
    stopOnError: false,
};
function powerform(initialValues, schema, config) {
    if (config === void 0) { config = exports.defaultConfig; }
    var form = new Form(config);
    // form.getNotified = true;
    var fields = {};
    for (var fieldName in schema) {
        var field = new Field(schema[fieldName], initialValues[fieldName], fieldName, form);
        fields[fieldName] = field;
    }
    form.fields = fields;
    form.setData(initialValues, true);
    return form;
}
exports.powerform = powerform;
