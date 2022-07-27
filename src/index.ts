class DecodeError extends Error {}

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
  private _error: string = "";

  // html input field value is always string no matter
  // what its type is, type is only for UI
  private initialValue: string = '""';
  private previousValue: string = '""';
  private currentValue: string = '""';

  private validators: Validator<NoUndefined<T>>[];

  constructor(
    private decoder: Decoder<T>,
    ...validators: Validator<NoUndefined<T>>[]
  ) {
    this.validators = validators;
  }

  optional() {
    const optionalDecoder = optional(this.decoder);
    return new Field<Optional<T>>(
      optionalDecoder,
      ...(this.validators as Validator<NoUndefined<T>>[])
    );
  }

  // sets initial values
  initValue(val: any) {
    this.initialValue =
      this.previousValue =
      this.currentValue =
        JSON.stringify(
          this.inputHandler ? this.inputHandler(val, this.previousValue) : val
        );
    return this;
  }

  onInput(i: InputHandler) {
    this.inputHandler = i;
    return this;
  }

  onError(i: ErrorHandler) {
    this.errorHandler = i;
    return this;
  }

  onChange(c: ChangeHandler<T>) {
    this.changeHandler = c;
    return this;
  }

  triggerOnError() {
    const callback = this.errorHandler;
    callback && callback(this.error);

    if (this.form) this.form.triggerOnError();
  }

  triggerOnChange() {
    const callback = this.changeHandler;
    callback && callback(this.raw);
    this.form && this.form.triggerOnChange();
  }

  setValue(val: any, skipTrigger?: boolean) {
    const strVal = JSON.stringify(val);
    if (this.currentValue === strVal) return;
    this.previousValue = this.currentValue;
    // input handlers should deal with actual value
    // not a strigified version
    this.currentValue = JSON.stringify(
      this.inputHandler ? this.inputHandler(val, this.previousValue) : val
    );

    if (skipTrigger) return;
    this.triggerOnChange();
  }

  get raw(): T {
    return JSON.parse(this.currentValue);
  }

  get value(): T {
    const [val, err] = this.decoder(JSON.parse(this.currentValue));
    if (err !== "") throw new DecodeError(`Invalid value at ${this.fieldName}`);
    return val;
  }

  _validate(): string | undefined {
    const [parsedVal, err] = this.decoder(JSON.parse(this.currentValue));
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
        all: this.form ? this.form.value : {},
      });
      if (err != undefined) {
        return err;
      }
    }
  }

  validate(): boolean {
    const err = this._validate();
    if (err === undefined) {
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
    if (this._error === error) return;
    this._error = error;

    if (skipTrigger) return;
    this.triggerOnError();
  }

  get error(): string {
    return this._error;
  }

  isDirty() {
    return this.previousValue !== this.currentValue;
  }

  makePristine() {
    this.initialValue = this.previousValue = this.currentValue;
    this.setError("");
  }

  reset() {
    this.setValue(JSON.parse(this.initialValue));
    this.makePristine();
  }

  setAndValidate(value: T) {
    this.setValue(value);
    this.validate();
    return this.error;
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
type FormConfig = {
  multipleErrors?: boolean;
  stopOnError?: boolean;
};

type FormErrorHandler<T> = (errors: Errors<T>) => void;
type FormChangeHandler<T> = (values: Values<T>) => void;
export class Form<T> {
  getNotified: boolean = true;
  errorHandler?: FormErrorHandler<T>;
  changeHandler?: FormChangeHandler<T>;

  constructor(
    public fields: Schema<T>,
    private config: FormConfig = defaultConfig
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
    return this;
  }

  onError(handler: FormErrorHandler<T>) {
    this.errorHandler = handler;
    return this;
  }

  onChange(handler: FormChangeHandler<T>) {
    this.changeHandler = handler;
    return this;
  }

  toggleGetNotified() {
    this.getNotified = !this.getNotified;
  }

  setValue(data: T, skipTrigger?: boolean) {
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
    const callback = this.changeHandler;
    this.getNotified && callback && callback(this.raw);
  }

  triggerOnError(): void {
    const callback = this.errorHandler;
    this.getNotified && callback && callback(this.error);
  }

  get value(): T {
    const data = {} as T;
    let fieldName: keyof typeof this.fields;
    for (fieldName in this.fields) {
      data[fieldName] = this.fields[fieldName].value;
    }
    return data;
  }

  get raw(): Values<T> {
    const data = {} as Values<T>;
    let fieldName: keyof typeof this.fields;
    for (fieldName in this.fields) {
      data[fieldName] = this.fields[fieldName].raw;
    }
    return data;
  }

  getUpdates(): T {
    const data = {} as T;
    let fieldName: keyof typeof this.fields;
    for (fieldName in this.fields) {
      if (this.fields[fieldName].isDirty()) {
        data[fieldName] = this.fields[fieldName].value;
      }
    }
    return data;
  }

  setError(errors: Errors<T>, skipTrigger?: boolean) {
    this.toggleGetNotified();
    let prop: keyof typeof errors;
    for (prop in errors) {
      this.fields[prop].setError(errors[prop], skipTrigger);
    }
    this.toggleGetNotified();

    if (skipTrigger) return;
    this.triggerOnError();
  }

  get error(): Errors<T> {
    const errors = {} as Errors<T>;
    let fieldName: keyof typeof this.fields;
    for (fieldName in this.fields) {
      errors[fieldName] = this.fields[fieldName].error;
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

    let fieldName: keyof typeof this.fields;
    for (fieldName in this.fields) {
      let validity: boolean;
      if (skipAttachError) {
        validity = this.fields[fieldName].isValid();
      } else {
        validity = this.fields[fieldName].validate();
      }
      if (!validity && this.config.stopOnError) {
        status = false;
        break;
      }
      status = validity && status;
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
  if (val === "") {
    return ["", `This field is required`];
  }
  return [val, ""];
}

export function numDecoder(val: string): [number, Error] {
  const num = JSON.parse(val);
  if (typeof num !== "number")
    return [NaN, `Expected a number, got ${typeof num}`];
  if (`${num}` === `${NaN}`) return [NaN, "This field is required"];
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

export function num(...validators: Validator<number>[]) {
  return new Field(numDecoder, ...validators);
}

export function bool(...validators: Validator<boolean>[]) {
  return new Field(boolDecoder, ...validators);
}
