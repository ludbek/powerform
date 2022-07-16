const STOP_VALIDATION_ERROR_NAME = "StopValidationError";

class StopValidationError extends Error {
  constructor() {
    super();
    this.name = STOP_VALIDATION_ERROR_NAME;
  }
}

const isEqual = (val1: unknown, val2: unknown): boolean => {
  return JSON.stringify(val1) === JSON.stringify(val2);
};

export class Field<T, F> {
  private error: string
  private previousValue: T
  private currentValue: T
  constructor(private validator: Validator<T, F>, private initialValue: T, private fieldName: string, private parent: Form<F>) {
    this.validator = validator;
    this.error = "";
    this.currentValue = this.previousValue = this.initialValue;
    this.setData(this.initialValue, true);
    this.makePristine();
  }

  triggerOnError() {
    if (this.parent) this.parent.triggerOnError();
  }

  triggerOnChange() {
    this.parent && this.parent.triggerOnChange();
  }

  setData(value: T, skipTrigger?: boolean) {
    if (isEqual(this.currentValue, value)) return;
    this.previousValue = this.currentValue;

    if (skipTrigger) return;
    this.triggerOnChange();
  }

  getData() {
    return this.currentValue;
  }

  validate() {
    const [_, err] = this.validator(this.currentValue, {
      prevValue: this.previousValue,
      fieldName: this.fieldName,
      all: this.parent.getData()
    })
    this.setError(err);
    return !Boolean(err);
  }

  isValid(): boolean {
    const [_, err] = this.validator(this.currentValue, {
      prevValue: this.previousValue,
      fieldName: this.fieldName,
      all: this.parent.getData()
    })
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
    this.setData(this.initialValue);
    this.makePristine();
  }

  setAndValidate(value: T) {
    this.setData(value);
    this.validate();
    return this.getError();
  }
}

type Fields<T> = {
  [K in keyof T]: Field<T[K], T>
}
export class Form<T> {
  getNotified: boolean = true
  // @ts-ignore
  fields: Fields<T>

  constructor(public config: Config<T>) {}

  toggleGetNotified() {
    this.getNotified = !this.getNotified;
  }

  setData(data: T, skipTrigger: boolean) {
    this.toggleGetNotified();
    let prop: keyof typeof data;
    for (prop in data) {
        this.fields[prop].setData(data[prop], skipTrigger);
    }
    this.toggleGetNotified();
    if (skipTrigger) return;
    this.triggerOnChange();
  }

  triggerOnChange(): void {
    const callback = this.config.onChange;
    this.getNotified && callback && callback(this.getData(), this);
  }

  triggerOnError(): void {
    const callback = this.config.onError;
    this.getNotified && callback && callback(this.getError(), this);
  }

  getData(): T {
    const data = {} as T
    let fieldName: keyof typeof this.fields
    for (fieldName in this.fields) {
        data[fieldName] = this.fields[fieldName].getData()
    }
    return data
  }

  getUpdates(): T {
    const data = {} as T
    let fieldName: keyof typeof this.fields
    for (fieldName in this.fields) {
      if (this.fields[fieldName].isDirty()) {
        data[fieldName] = this.fields[fieldName].getData()
      }
    }
    return data
  }

  setError(errors: Error<T>, skipTrigger: boolean) {
    this.toggleGetNotified();
    let prop: keyof typeof errors;
    for (prop in errors) {
      this.fields[prop].setError(errors[prop], skipTrigger);
    }
    this.toggleGetNotified();

    if (skipTrigger) return;
    this.triggerOnError();
  }

  getError(): Error<T> {
    const errors = {} as Error<T>
    let fieldName: keyof typeof this.fields
    for (fieldName in this.fields) {
        errors[fieldName] = this.fields[fieldName].getError()
    }
    return errors
  }

  isDirty(): boolean {
    let fieldName: keyof typeof this.fields
    for (fieldName in this.fields) {
      if (this.fields[fieldName].isDirty()) return true;
    }
    return false;
  }

  makePristine() {
    this.toggleGetNotified();
    let fieldName: keyof typeof this.fields
    for (fieldName in this.fields) {
      this.fields[fieldName].makePristine();
    }
    this.toggleGetNotified();
    this.triggerOnError();
  }

  reset() {
    this.toggleGetNotified();
    let fieldName: keyof typeof this.fields
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
      let fieldName: keyof typeof this.fields
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

type Error<T> = {
  [K in keyof T]: string
}

export type Config<T> = {
  onChange?: (data: T, form: Form<T>) => void
  onError?: (error: Error<T>, form: Form<T>) => void
  multipleErrors: boolean
  stopOnError: boolean
};

export type Context<T,F> = {
  prevValue: T
  fieldName: string
  all: F
}
export type Validator<T, F> = (val: T, ctx?: Context<T, F>) => [T, string]

type Schema<T> = {
  [K in keyof T]: Validator<T[K], T>
}

export const defaultConfig  = {
  multipleErrors: false,
  stopOnError: false,
}
export function powerform<T extends Record<string, any>>(initialValues: T, schema: Schema<T>, config: Config<T> = defaultConfig): Form<T> {
  const form = new Form<T>(config);
 
  // form.getNotified = true;

  const fields = {} as Fields<T>
  for (const fieldName in schema) {
    const field = new Field(schema[fieldName], initialValues[fieldName], fieldName, form);
    fields[fieldName] = field;
  }

  form.fields = fields
  form.setData(initialValues, true);
  return form
}

