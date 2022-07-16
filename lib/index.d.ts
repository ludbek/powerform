export declare class Field<T, F> {
    private validator;
    private initialValue;
    private fieldName;
    private parent;
    private error;
    private previousValue;
    private currentValue;
    constructor(validator: Validator<T, F>, initialValue: T, fieldName: string, parent: Form<F>);
    triggerOnError(): void;
    triggerOnChange(): void;
    setData(value: T, skipTrigger?: boolean): void;
    getData(): T;
    validate(): boolean;
    isValid(): boolean;
    setError(error: string, skipTrigger?: boolean): void;
    getError(): string;
    isDirty(): boolean;
    makePristine(): void;
    reset(): void;
    setAndValidate(value: T): string;
}
declare type Fields<T> = {
    [K in keyof T]: Field<T[K], T>;
};
export declare class Form<T> {
    config: Config<T>;
    getNotified: boolean;
    fields: Fields<T>;
    constructor(config: Config<T>);
    toggleGetNotified(): void;
    setData(data: T, skipTrigger: boolean): void;
    triggerOnChange(): void;
    triggerOnError(): void;
    getData(): T;
    getUpdates(): T;
    setError(errors: Error<T>, skipTrigger: boolean): void;
    getError(): Error<T>;
    isDirty(): boolean;
    makePristine(): void;
    reset(): void;
    _validate(skipAttachError: boolean): boolean;
    validate(): boolean;
    isValid(): boolean;
}
declare type Error<T> = {
    [K in keyof T]: string;
};
export declare type Config<T> = {
    onChange?: (data: T, form: Form<T>) => void;
    onError?: (error: Error<T>, form: Form<T>) => void;
    multipleErrors: boolean;
    stopOnError: boolean;
};
export declare type Context<T, F> = {
    prevValue: T;
    fieldName: string;
    all: F;
};
export declare type Validator<T, F> = (val: T, ctx?: Context<T, F>) => [T, string];
declare type Schema<T> = {
    [K in keyof T]: Validator<T[K], T>;
};
export declare const defaultConfig: {
    multipleErrors: boolean;
    stopOnError: boolean;
};
export declare function powerform<T extends Record<string, any>>(initialValues: T, schema: Schema<T>, config?: Config<T>): Form<T>;
export {};
