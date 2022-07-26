const STOP_VALIDATION_ERROR_NAME = "StopDecodeError";

class DecodeError extends Error {}

class StopValidationError extends Error {
  constructor() {
    super();
    this.name = STOP_VALIDATION_ERROR_NAME;
  }
}

type Optional<T> = T | undefined;
function optional<T>(decoder: Decoder<T>) {
  return (val: string): [Optional<T>, Error] => {
    if (val === "") return [undefined, ""];
    return decoder(val);
  };
}

type Error = string;
type Decoder<T> = (val: string) => [T, Error];
type ChangeHandler<T> = (val: T) => void;
type InputHandler = (val: string, preVal: string) => string;
type ErrorHandler = (error: string) => void;
export class Field<T> {
  changeHandler?: ChangeHandler<T>;
  inputHandler?: InputHandler;
  errorHandler?: ErrorHandler;
  fieldName: string = "";
  form?: any;
  private error: string = "";

  // html input field value is always string no matter
  // what its type is, type is only for UI
  private initialValue: string = "";
  private previousValue: string = "";
  private currentValue: string = "";

  private validators: Validator<NoUndefined<T>>[];

  constructor(
    private decoder: Decoder<T>,
    ...validators: Validator<NoUndefined<T>>[]
  ) {
    this.validators = validators;
  }

  stringify(val: any) {
    return typeof val === "string" ? val : JSON.stringify(val);
  }

  optional() {
    const optionalDecoder = optional(this.decoder);
    return new Field<Optional<T>>(
      optionalDecoder,
      ...(this.validators as Validator<NoUndefined<T>>[])
    );
  }

  initValue(val: any) {
    const strVal = this.stringify(val);
    this.initialValue =
      this.previousValue =
      this.currentValue =
        this.inputHandler
          ? this.inputHandler(strVal, this.previousValue)
          : strVal;
  }

  onInput(i: InputHandler) {
    this.inputHandler = i;
    return this;
  }

  onChange(c: ChangeHandler<T>) {
    this.changeHandler = c;
    return this;
  }

  triggerOnError() {
    const callback = this.errorHandler;
    callback && callback(this.getError());

    if (this.form) this.form.triggerOnError();
  }

  triggerOnChange() {
    const callback = this.changeHandler;
    const [val, err] = this.decoder(this.currentValue);
    if (err !== "") {
      return;
    }
    callback && callback(val);
    this.form && this.form.triggerOnChange();
  }

  setValue(val: any, skipTrigger?: boolean) {
    const strVal = this.stringify(val);
    if (this.currentValue === strVal) return;
    this.previousValue = this.currentValue;
    this.currentValue = this.inputHandler
      ? this.inputHandler(strVal, this.previousValue)
      : strVal;

    if (skipTrigger) return;
    this.triggerOnChange();
  }

  getRaw(): string {
    return this.currentValue;
  }

  getValue(): T {
    const [val, err] = this.decoder(this.currentValue);
    if (err !== "") throw new DecodeError(`Invalid value at ${this.fieldName}`);
    return val;
  }

  _validate(): string | undefined {
    const [parsedVal, err] = this.decoder(this.currentValue);
    if (err !== "") {
      return err;
    }
    if (parsedVal === undefined) return;
    const [preValue, _] = this.decoder(this.previousValue);
    if (preValue === undefined) return;

    for (const v of this.validators) {
      const err = v(parsedVal as NoUndefined<T>, {
        prevValue: preValue as NoUndefined<T>,
        fieldName: this.fieldName,
        all: this.form ? this.form.getValue() : {},
      });
      if (err != undefined) {
        return err;
      }
    }
  }

  validate(): boolean {
    const err = this._validate();
    if (err == undefined) {
      this.setError("");
      return true;
    }

    this.setError(err);
    return false;
  }

  isValid(): boolean {
    const err = this._validate();
    return !Boolean(err);
  }

  setError(error: string, skipTrigger?: boolean) {
    if (this.error === error) return;
    this.error = error;

    if (skipTrigger) return;
    this.triggerOnError();
  }

  getError(): string {
    return this.error;
  }

  isDirty() {
    return this.previousValue !== this.currentValue;
  }

  makePristine() {
    this.initialValue = this.previousValue = this.currentValue;
    this.setError("");
  }

  reset() {
    this.setValue(this.initialValue);
    this.makePristine();
  }

  setAndValidate(value: T) {
    this.setValue(value);
    this.validate();
    return this.getError();
  }
}

type Schema<T> = {
  [K in keyof T]: Field<T[K]>;
};
type Values<T> = {
  [K in keyof T]: T[K];
};

export const defaultConfig = {
  multipleErrors: false,
  stopOnError: false,
};
export class Form<T> {
  getNotified: boolean = true;

  constructor(
    public fields: Schema<T>,
    private config: Config<T> = defaultConfig
  ) {
    for (const fieldName in fields) {
      fields[fieldName].form = this;
      fields[fieldName].fieldName = fieldName;
    }
  }

  initValue(values: Values<T>) {
    for (const fieldName in this.fields) {
      this.fields[fieldName].initValue(values[fieldName]);
    }
  }

  toggleGetNotified() {
    this.getNotified = !this.getNotified;
  }

  setValue(data: T, skipTrigger: boolean) {
    this.toggleGetNotified();
    let prop: keyof typeof data;
    for (prop in data) {
      this.fields[prop].setValue(data[prop], skipTrigger);
    }
    this.toggleGetNotified();
    if (skipTrigger) return;
    this.triggerOnChange();
  }

  triggerOnChange(): void {
    const callback = this.config.onChange;
    this.getNotified && callback && callback(this.getValue(), this);
  }

  triggerOnError(): void {
    const callback = this.config.onError;
    this.getNotified && callback && callback(this.getError(), this);
  }

  getValue(): T {
    const data = {} as T;
    let fieldName: keyof typeof this.fields;
    for (fieldName in this.fields) {
      data[fieldName] = this.fields[fieldName].getValue();
    }
    return data;
  }

  getUpdates(): T {
    const data = {} as T;
    let fieldName: keyof typeof this.fields;
    for (fieldName in this.fields) {
      if (this.fields[fieldName].isDirty()) {
        data[fieldName] = this.fields[fieldName].getValue();
      }
    }
    return data;
  }

  setError(errors: Errors<T>, skipTrigger: boolean) {
    this.toggleGetNotified();
    let prop: keyof typeof errors;
    for (prop in errors) {
      this.fields[prop].setError(errors[prop], skipTrigger);
    }
    this.toggleGetNotified();

    if (skipTrigger) return;
    this.triggerOnError();
  }

  getError(): Errors<T> {
    const errors = {} as Errors<T>;
    let fieldName: keyof typeof this.fields;
    for (fieldName in this.fields) {
      errors[fieldName] = this.fields[fieldName].getError();
    }
    return errors;
  }

  isDirty(): boolean {
    let fieldName: keyof typeof this.fields;
    for (fieldName in this.fields) {
      if (this.fields[fieldName].isDirty()) return true;
    }
    return false;
  }

  makePristine() {
    this.toggleGetNotified();
    let fieldName: keyof typeof this.fields;
    for (fieldName in this.fields) {
      this.fields[fieldName].makePristine();
    }
    this.toggleGetNotified();
    this.triggerOnError();
  }

  reset() {
    this.toggleGetNotified();
    let fieldName: keyof typeof this.fields;
    for (fieldName in this.fields) {
      this.fields[fieldName].reset();
    }
    this.toggleGetNotified();
    this.triggerOnError();
    this.triggerOnChange();
  }

  _validate(skipAttachError: boolean) {
    let status: boolean = true;
    this.toggleGetNotified();

    try {
      let fieldName: keyof typeof this.fields;
      for (fieldName in this.fields) {
        let validity: boolean;
        if (skipAttachError) {
          validity = this.fields[fieldName].isValid();
        } else {
          validity = this.fields[fieldName].validate();
        }
        if (!validity && this.config.stopOnError) {
          throw new StopValidationError();
        }
        status = validity && status;
      }
    } catch (err) {
      if (err instanceof StopValidationError) {
        status = false;
      } else {
        throw err;
      }
    }

    this.toggleGetNotified();
    return status;
  }

  validate() {
    const validity = this._validate(false);
    this.triggerOnError();
    return validity;
  }

  isValid() {
    return this._validate(true);
  }
}

type Errors<T> = {
  [K in keyof T]: string;
};

export type Config<T> = {
  onChange?: (data: T, form: Form<T>) => void;
  onError?: (error: Errors<T>, form: Form<T>) => void;
  multipleErrors: boolean;
  stopOnError: boolean;
};

export type Context<T> = {
  prevValue: T;
  fieldName: string;
  all: Record<string, any>;
};

type NoUndefined<T> = T extends undefined ? never : T;
export type Validator<T> = (val: T, ctx?: Context<T>) => string | undefined;

export function strDecoder(val: string): [string, Error] {
  if (typeof val !== "string")
    return ["", `Expected a string, got ${typeof val}`];
  return [val, ""];
}

export function numDecoder(val: string): [number, Error] {
  const num = JSON.parse(val);
  if (typeof num !== "number")
    return [NaN, `Expected a number, got ${typeof num}`];
  return [num, ""];
}

export function boolDecoder(val: string): [boolean, Error] {
  const bool = JSON.parse(val);
  if (typeof bool !== "boolean")
    return [false, `Expected a boolean, got ${typeof bool}`];
  return [bool, ""];
}

export function str(...validators: Validator<string>[]) {
  return new Field(strDecoder, ...validators);
}
