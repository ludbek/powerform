import { Form, Validator, Context, str, num } from "./index";

export function equals<T>(fieldName: string): Validator<T> {
  return (val: T, ctx?: Context<T>) => {
    if (ctx !== undefined) {
      if (val != ctx.all[fieldName]) {
        return `Must be equal to "${fieldName}"`;
      }
      return undefined;
    }
    return undefined;
  };
}

export const noop = () => {};

function capitalize(val: string) {
  if (val === "") return val;
  return val.replace(/(?:^|\s)\S/g, (s) => s.toUpperCase());
}

function signupForm() {
  return new Form({
    username: str(),
    name: str().onInput(capitalize),
    password: str(),
    confirmPassword: str(equals("password")),
  });
}

describe("field.constructor()", () => {
  it("sets the decoder and validators", () => {
    function isApple(val: string) {
      if (val !== "apple") return "Expected an apple";
      return undefined;
    }
    const fruitField = str(isApple);
    fruitField.setAndValidate("banana");
    expect(fruitField.error).toEqual("Expected an apple");
    expect(fruitField.value).toEqual("banana");
  });
});

describe("field.setValue", () => {
  it("sets current value", () => {
    const value = "apple";
    const field = str();
    field.setValue(value);

    expect(field.value).toEqual(value);
  });

  it("calls onInput and sets value returned by it", () => {
    const field = str().onInput(capitalize);
    field.setValue("red apple");
    expect(field.value).toEqual("Red Apple");
  });

  it("calls onChange callback if exists", () => {
    const spy = jest.fn();
    const fruit = str().onChange(spy);
    const value = "apple";
    fruit.setValue(value);
    expect(spy.mock.calls[0][0]).toEqual(value);
  });

  it("won't call onChange if value has not changed", () => {
    const spy = jest.fn();
    const fruit = str().onChange(spy);
    const value = "apple";
    fruit.setValue(value);
    expect(spy.mock.calls.length).toEqual(1);

    fruit.setValue(value);
    expect(spy.mock.calls.length).toEqual(1);
  });

  it("won't call onChange callback if 'skipTrigger' is true", () => {
    const spy = jest.fn();
    const fruit = str().onChange(spy);
    const value = "apple";
    fruit.setValue(value, true);
    expect(spy.mock.calls.length).toEqual(0);
  });
});

describe("field.getValue()", () => {
  it("returns current value", () => {
    const value = "apple";
    const fruit = str();
    fruit.setValue(value);

    expect(fruit.value).toEqual(value);
  });
});

describe("field.validate()", () => {
  it("returns true on positive validation", () => {
    const { fields } = new Form({
      fruit: str(),
    });
    fields.fruit.setValue("apple");

    expect(fields.fruit.validate()).toEqual(true);
  });

  it("returns false on negative validation", () => {
    const { fields } = new Form({
      fruit: str(),
    });
    fields.fruit.setValue(1);

    expect(fields.fruit.validate()).toEqual(false);
  });

  it("sets error", () => {
    const { fields } = new Form({
      fruit: str(),
    });
    fields.fruit.setValue(1);
    fields.fruit.validate();

    expect(fields.fruit.error).toEqual("Expected a string, got number");
  });

  it("can validate in relation to other form fields if exists", () => {
    const { fields } = new Form({
      password: str(),
      confirmPassword: str(equals("password")),
    });

    fields.password.setValue("apple");
    fields.confirmPassword.setValue("banana");
    fields.confirmPassword.validate();
    expect(fields.confirmPassword.error).toEqual(
      `Must be equal to \"password\"`
    );
  });
});

describe("field.isValid()", () => {
  const schema = { fruit: str() };

  it("returns true on positive validation", () => {
    const { fields } = new Form(schema);
    fields.fruit.setValue("apple");

    expect(fields.fruit.isValid()).toEqual(true);
  });

  it("returns false on negative validation", () => {
    const { fields } = new Form(schema);
    fields.fruit.setValue(1);

    expect(fields.fruit.isValid()).toEqual(false);
  });

  it("wont set error", () => {
    const { fields } = new Form(schema);
    fields.fruit.setValue(1);

    expect(fields.fruit.isValid()).toEqual(false);
    expect(fields.fruit.error).toEqual("");
  });
});

describe("field.setError()", () => {
  it("sets error", () => {
    const schema = { fruit: str() };
    const { fields } = new Form(schema);
    const errMsg = "Nice error !!!";
    fields.fruit.setError(errMsg);
    expect(fields.fruit.error).toEqual(errMsg);
  });

  it("calls onError callback if exists", () => {
    const spy = jest.fn();
    const schema = {
      fruit: str().onError(spy),
    };
    const { fields } = new Form(schema);
    const errMsg = "Nice error !!!";
    fields.fruit.setError(errMsg);
    expect(spy.mock.calls.length).toEqual(1);
  });

  it("wont call onError callback if 'skipError' is true", () => {
    const spy = jest.fn();
    const schema = {
      fruit: str().onError(spy),
    };
    const { fields } = new Form(schema);
    const errMsg = "Nice error !!!";
    fields.fruit.setError(errMsg, true);
    expect(spy.mock.calls.length).toEqual(0);
  });
});

describe("field.getError()", () => {
  it("returns error", () => {
    const { fields } = new Form({ fruit: str() });
    const errMsg = "Nice error !!!";
    fields.fruit.setError(errMsg);
    expect(fields.fruit.error).toEqual(errMsg);
  });
});

describe("field.isDirty()", () => {
  it("returns true for dirty field", () => {
    const { fields } = new Form({ fruit: str() });
    fields.fruit.setValue("apple");
    expect(fields.fruit.isDirty()).toEqual(true);
  });

  it("returns false for non dirty field", () => {
    const { fields } = new Form({ fruit: str() });
    expect(fields.fruit.isDirty()).toEqual(false);
  });
});

describe("field.makePristine()", () => {
  it("sets previousValue and initialValue to currentValue", () => {
    const { fields } = new Form({ fruit: str() });
    fields.fruit.setValue("apple");
    expect(fields.fruit.isDirty()).toEqual(true);

    fields.fruit.makePristine();
    expect(fields.fruit.isDirty()).toEqual(false);
  });

  it("empties error", () => {
    const { fields } = new Form({ fruit: str() });
    fields.fruit.validate();
    expect(fields.fruit.error).toEqual("This field is required");

    fields.fruit.makePristine();
    expect(fields.fruit.error).toEqual("");
  });
});

describe("field.reset()", () => {
  it("sets currentValue and previousValue to initialValue", () => {
    const { fields } = new Form({ fruit: str() }).initValue({ fruit: "apple" });
    fields.fruit.setValue("banana");
    expect(fields.fruit.value).toEqual("banana");

    fields.fruit.reset();
    expect(fields.fruit.value).toEqual("apple");
  });

  it("calls onChange callback", () => {
    const spy = jest.fn();
    const { fields } = new Form({
      fruit: str().onChange(spy),
    });
    fields.fruit.setValue("banana");
    expect(fields.fruit.value).toEqual("banana");

    fields.fruit.reset();
    expect(spy.mock.calls[1][0]).toEqual("");
  });

  it("empties error", () => {
    const { fields } = new Form({ fruit: str() });
    fields.fruit.validate();
    expect(fields.fruit.error).toEqual("This field is required");

    fields.fruit.reset();
    expect(fields.fruit.error).toEqual("");
  });
});

describe("field.setAndValidate()", () => {
  it("sets and validates field", () => {
    const { fields } = new Form({ fruit: str() });
    const error = fields.fruit.setAndValidate("");
    expect(error).toEqual("This field is required");
  });
});

describe("powerform", () => {
  it("returns form instance", () => {
    const form = signupForm();
    expect(form instanceof Form).toEqual(true);
  });

  it("attaches self to each field", () => {
    const form = signupForm();
    const { fields } = form;
    expect(fields.username.form).toBe(form);
    expect(fields.password.form).toBe(form);
    expect(fields.confirmPassword.form).toBe(form);
  });

  it("attaches field name to each field", () => {
    const form = signupForm();
    const { fields } = form;
    expect(fields.username.fieldName).toEqual("username");
    expect(fields.password.fieldName).toEqual("password");
    expect(fields.confirmPassword.fieldName).toEqual("confirmPassword");
  });
});

describe("form.validate", () => {
  it("returns true if all the fields are valid", () => {
    const form = signupForm();
    const data = {
      username: "ausername",
      name: "a name",
      password: "apassword",
      confirmPassword: "apassword",
    };
    form.setValue(data);
    expect(form.validate()).toEqual(true);
  });

  it("returns false if any of the field is invalid", () => {
    const form = signupForm();
    const data = {
      username: "ausername",
      name: "a name",
      password: "apassword",
      confirmPassword: "",
    };
    form.setValue(data);
    expect(form.validate()).toEqual(false);
  });

  it("sets error", () => {
    const form = signupForm();
    form.validate();
    expect(form.error).toEqual({
      confirmPassword: "This field is required",
      name: "This field is required",
      password: "This field is required",
      username: "This field is required",
    });
  });

  it("calls onError callback", () => {
    const spy = jest.fn();
    const form = signupForm().onError(spy);
    form.validate();

    expect(spy.mock.calls.length).toEqual(1);
  });

  it("respects config.stopOnError", () => {
    const schema = {
      username: str(),
      name: str(),
      password: str(),
    };
    const config = { stopOnError: true };
    const form = new Form(schema, config);
    const { fields } = form;
    fields.username.setValue("a username");
    expect(form.validate()).toEqual(false);
    expect(fields.username.error).toEqual("");
    expect(fields.name.error).toEqual("This field is required");
    expect(fields.password.error).toEqual("");
  });
});

describe("form.isValid", () => {
  it("returns true if all the fields are valid", () => {
    const form = signupForm();
    const data = {
      username: "ausername",
      name: "a name",
      password: "apassword",
      confirmPassword: "apassword",
    };
    form.setValue(data);
    expect(form.isValid()).toEqual(true);
  });

  it("returns false if any of the field is invalid", () => {
    const form = signupForm();
    const data = {
      username: "ausername",
      name: "a name",
      password: "apassword",
      confirmPassword: "",
    };
    form.setValue(data);
    expect(form.isValid()).toEqual(false);
  });

  it("won't set error", () => {
    const form = signupForm();
    form.isValid();
    expect(form.error).toEqual({
      confirmPassword: "",
      name: "",
      password: "",
      username: "",
    });
  });

  it("won't call onError callback", () => {
    const spy = jest.fn();
    const form = signupForm().onError(spy);
    form.isValid();

    expect(spy.mock.calls.length).toEqual(0);
  });
});

describe("form.setData", () => {
  it("sets data of each field", () => {
    const form = new Form({ price: num() });
    const data = { price: 1 };
    form.setValue(data);

    expect(form.fields.price.value).toEqual(data.price);
  });

  it("wont trigger update event from fields", () => {
    const spy = jest.fn();
    const form = signupForm().onChange(spy);
    const data = {
      username: "ausername",
      name: "A Name",
      password: "apassword",
      confirmPassword: "apassword",
    };
    form.setValue(data);

    expect(spy.mock.calls.length).toEqual(1);
    expect(spy.mock.calls[0][0]).toEqual(data);
  });
});

describe("form.getUpdates", () => {
  it("returns key value pair of updated fields and their value", () => {
    const form = signupForm();
    form.fields.username.setValue("ausername");
    form.fields.password.setValue("apassword");

    const expected = {
      username: "ausername",
      password: "apassword",
    };
    expect(form.getUpdates()).toEqual(expected);
  });
});

describe("form.setError", () => {
  it("sets error on each field", () => {
    const form = signupForm();
    const errors = {
      name: "",
      username: "a error",
      password: "a error",
      confirmPassword: "",
    };

    form.setError(errors);

    expect(form.fields.username.error).toEqual(errors.username);
    expect(form.fields.password.error).toEqual(errors.password);
  });

  it("calls onError callback only once", () => {
    const spy = jest.fn();
    const form = signupForm().onError(spy);
    const errors = {
      name: "",
      username: "a error",
      password: "a error",
      confirmPassword: "",
    };
    form.setError(errors);

    expect(spy.mock.calls.length).toEqual(1);
    expect(spy.mock.calls[0]).toEqual([errors]);
  });
});

describe("form.getError", () => {
  it("returns errors from every fields", () => {
    const form = signupForm();
    form.fields.username.setError("a error");
    form.fields.password.setError("a error");

    const expected = {
      username: "a error",
      name: "",
      password: "a error",
      confirmPassword: "",
    };
    expect(form.error).toEqual(expected);
  });
});

describe("form.isDirty", () => {
  it("returns true if any field's data has changed", () => {
    const form = signupForm();
    form.fields.username.setValue("ausername");
    expect(form.isDirty()).toEqual(true);
  });

  it("returns false if non of the field's data has changed", () => {
    const form = signupForm();
    expect(form.isDirty()).toEqual(false);
  });
});

describe("form.makePristine", () => {
  it("makes all the fields prestine", () => {
    const form = signupForm();
    const data = {
      name: "",
      username: "ausername",
      password: "apassword",
      confirmPassword: "password confirmation",
    };
    form.setValue(data);
    expect(form.isDirty()).toEqual(true);
    form.makePristine();
    expect(form.isDirty()).toEqual(false);
  });

  it("empties all the error fields and calls onError callback only once", () => {
    const spy = jest.fn();
    const form = signupForm().onError(spy);
    form.setValue({
      name: "",
      password: "",
      username: "ausername",
      confirmPassword: "",
    });
    form.validate(); // first call
    expect(form.isDirty()).toEqual(true);
    expect(form.error).toEqual({
      confirmPassword: "This field is required",
      name: "This field is required",
      password: "This field is required",
      username: "",
    });

    form.makePristine(); // second call
    expect(form.isDirty()).toEqual(false);
    expect(form.error).toEqual({
      confirmPassword: "",
      name: "",
      password: "",
      username: "",
    });
    expect(spy.mock.calls.length).toEqual(2);
  });
});

describe("form.reset", () => {
  it("resets all the fields and calls onChange callback only once", () => {
    const spy = jest.fn();
    const form = signupForm().onChange(spy);
    const data = {
      username: "ausername",
      name: "a name",
      password: "apassword",
      confirmPassword: "password confirmation",
    };
    form.setValue(data); // first trigger
    form.reset(); // second trigger

    const expected = {
      username: "",
      name: "",
      password: "",
      confirmPassword: "",
    };
    expect(form.raw).toEqual(expected);
    expect(spy.mock.calls.length).toEqual(2);
  });

  it("resets all the errors and calls onError callback only once", () => {
    const spy = jest.fn();
    const form = signupForm().onError(spy);
    form.validate(); // 1st trigger
    form.reset(); // 2nd triggter

    const expected = {
      username: "",
      name: "",
      password: "",
      confirmPassword: "",
    };
    expect(form.error).toEqual(expected);
    expect(spy.mock.calls.length).toEqual(2);
  });
});

describe("form.triggerOnChange", () => {
  it("calls callback with value", () => {
    const spy = jest.fn();
    const form = signupForm().onChange(spy);
    const data = {
      username: "ausername",
      password: "",
      name: "",
      confirmPassword: "",
    };
    form.setValue(data);
    form.triggerOnChange();
    expect(spy.mock.calls.length).toEqual(2);
    expect(spy.mock.calls[1]).toEqual([data]);
  });

  it("won't call onChange callback if 'getNotified' is false", () => {
    const spy = jest.fn();
    const form = signupForm().onChange(spy);
    form.setValue({
      username: "ausername",
      password: "",
      name: "",
      confirmPassword: "",
    });
    form.toggleGetNotified();
    form.triggerOnChange();
    expect(spy.mock.calls.length).toEqual(1);
  });
});

describe("form.triggerOnError", () => {
  it("calls callback with value and form instance", () => {
    const spy = jest.fn();
    const form = signupForm().onError(spy);
    const errors = {
      username: "an error",
      name: "",
      password: "",
      confirmPassword: "",
    };
    form.setError(errors);
    form.triggerOnError();
    expect(spy.mock.calls.length).toEqual(2);
    expect(spy.mock.calls[1]).toEqual([errors]);
  });

  it("won't call onError callback if 'getNotified' is false", () => {
    const spy = jest.fn();
    const form = signupForm().onError(spy);
    form.validate();
    form.toggleGetNotified();
    form.triggerOnError();
    expect(spy.mock.calls.length).toEqual(1);
  });
});
