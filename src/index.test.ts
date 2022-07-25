import { Form, Field, powerform, FuncValidator, Context } from "./index";

function str(val: string) {
  if (typeof val !== "string") {
    return "Must be a string";
  }
  if (val === "") {
    return "This field is required";
  }
}

export function equals<T, F extends Record<string, any>>(
  fieldName: string
): FuncValidator<T, F> {
  return (val: T, ctx?: Context<T, F>) => {
    if (ctx !== undefined) {
      if (val != ctx.all[fieldName]) {
        return `Must be equal to "${fieldName}"`;
      }
    }
  };
}

export function o<T, F>(...validators: FuncValidator<T, F>[]) {
  return (val: T, ctx?: Context<T, F>): string | undefined => {
    for (const v of validators) {
      const err = v(val, ctx);
      if (err !== undefined) {
        return err;
      }
    }
  };
}

export const noop = () => {};
const noopForm = powerform({}, {});

export const nameField = {
  validator: str,
  masker(value: string) {
    if (value === "") return value;
    return value.replace(/(?:^|\s)\S/g, (s) => s.toUpperCase());
  },
};

const signupSchema = {
  username: str,
  name: nameField,
  password: str,
  confirmPassword: o(str, equals("password")),
};

describe("field.constructor()", () => {
  it("skips data change trigger while setting default value", () => {
    const initialVal = "apple";
    const form = powerform({}, {});
    const validator = {
      validator: str,
      onChange: jest.fn(),
    };
    const field = new Field(validator, initialVal, "afield", form);
    expect(field.getData()).toEqual(initialVal);
    expect(validator.onChange.mock.calls.length).toEqual(0);
  });

  it("won't mark field as dirty", () => {
    const initialVal = "apple";
    const form = powerform({}, {});
    const field = new Field(str, initialVal, "afield", form);
    expect(field.isDirty()).toEqual(false);
  });
});

describe("field.setData", () => {
  it("sets current value", () => {
    const initialValue: string = "";
    const value: string = "apple";
    const field = new Field(str, initialValue, "afield", noopForm);
    field.setData(value);

    const got = field.getData();
    expect(got).toEqual(value);
  });

  it("calls modify and sets value returned by it", () => {
    let nVal = "",
      pVal = "";

    const afield = {
      validator: str,
      modify(newVal: string, preVal: string) {
        nVal = newVal;
        pVal = preVal;
        return newVal.replace(/(?:^|\s)\S/g, function (s) {
          return s.toUpperCase();
        });
      },
    };

    const field = new Field(afield, "", "afield", noopForm);
    field.setData("red");
    field.setData("red apple");
    expect(field.getData()).toEqual("Red Apple");
    expect(nVal).toEqual("red apple");
    expect(pVal).toEqual("Red");
  });

  it("sets previous value", () => {
    const { fields } = powerform(
      { fruit: "" },
      {
        fruit: str,
      }
    );

    fields.fruit.setData("apple");
    expect(fields.fruit.getPreviousData()).toEqual("");

    fields.fruit.setData("banana");
    expect(fields.fruit.getPreviousData()).toEqual("apple");
  });

  it("calls onChange callback if exists", () => {
    const spy = jest.fn();
    const v = {
      validator: str,
      onChange: spy,
    };
    const { fields } = powerform(
      { fruit: "" },
      {
        fruit: v,
      }
    );
    const value = "apple";
    fields.fruit.setData(value);
    expect(spy.mock.calls[0][0]).toEqual(value);
    expect(spy.mock.calls[0][1]).toBe(fields.fruit);
  });

  it("won't call onChange if value has not changed", () => {
    const spy = jest.fn();
    const v = {
      validator: str,
      onChange: spy,
    };

    const { fields } = powerform(
      { fruit: "" },
      {
        fruit: v,
      }
    );
    const value = "apple";
    fields.fruit.setData(value);
    expect(spy.mock.calls.length).toEqual(1);

    fields.fruit.setData(value);
    expect(spy.mock.calls.length).toEqual(1);
  });

  it("won't call onChange callback if 'skipTrigger' is true", () => {
    const spy = jest.fn();
    const v = {
      validator: str,
      onChange: spy,
    };
    const { fields } = powerform(
      { fruit: "" },
      {
        fruit: v,
      }
    );
    const value = "apple";
    fields.fruit.setData(value, true);
    expect(spy.mock.calls.length).toEqual(0);
  });
});

describe("field.getData()", () => {
  it("returns current value", () => {
    const value = "apple";
    const { fields } = powerform(
      { fruit: "" },
      {
        fruit: str,
      }
    );
    fields.fruit.setData(value);

    const got = fields.fruit.getData();
    expect(got).toEqual(value);
  });
});

describe("field.getCleanData", () => {
  it("returns data processed by Field.clean()", () => {
    const { fields } = powerform(
      { fruit: "apple" },
      {
        fruit: {
          validator: str,
          clean(value) {
            return value.toUpperCase();
          },
        },
      }
    );
    expect(fields.fruit.getData()).toEqual("apple");
    expect(fields.fruit.getCleanData()).toEqual("APPLE");
  });
});

describe("field.validate()", () => {
  it("returns true on positive validation", () => {
    const { fields } = powerform({ fruit: "" }, { fruit: str });
    fields.fruit.setData("apple");

    expect(fields.fruit.validate()).toEqual(true);
  });

  it("returns false on negative validation", () => {
    const { fields } = powerform({ fruit: "" }, { fruit: str });
    fields.fruit.setData("");

    expect(fields.fruit.validate()).toEqual(false);
  });

  it("sets error", () => {
    const { fields } = powerform({ fruit: "" }, { fruit: str });
    fields.fruit.validate();

    expect(fields.fruit.getError()).toEqual("This field is required");
  });

  it("can validate in relation to other form fields if exists", () => {
    const { fields } = powerform(
      {
        password: "",
        confirmPassword: "",
      },
      {
        password: str,
        confirmPassword: o(str, equals("password")),
      }
    );

    fields.password.setData("apple");
    fields.confirmPassword.setData("banana");
    fields.confirmPassword.validate();
    expect(fields.confirmPassword.getError()).toEqual(
      `Must be equal to \"password\"`
    );
  });
});

describe("field.isValid()", () => {
  const initialValues = { fruit: "" };
  const schema = { fruit: str };

  it("returns true on positive validation", () => {
    const { fields } = powerform(initialValues, schema);
    fields.fruit.setData("apple");

    expect(fields.fruit.isValid()).toEqual(true);
  });

  it("returns false on negative validation", () => {
    const { fields } = powerform(initialValues, schema);

    expect(fields.fruit.isValid()).toEqual(false);
  });

  it("wont set error", () => {
    const { fields } = powerform(initialValues, schema);

    expect(fields.fruit.isValid()).toEqual(false);
    expect(fields.fruit.getError()).toEqual("");
  });

  it("can validate in relation to other form fields if exists", () => {
    const initialValues = { password: "", confirmPassword: "" };
    const schema = {
      password: str,
      confirmPassword: o(str, equals("password")),
    };
    const { fields } = powerform(initialValues, schema);

    fields.password.setData("apple");
    fields.confirmPassword.setData("banana");
    expect(fields.confirmPassword.isValid()).toEqual(false);
  });
});

describe("field.setError()", () => {
  const initialValues = { fruit: "" };
  it("sets error", () => {
    const schema = { fruit: str };
    const { fields } = powerform(initialValues, schema);
    const errMsg = "Nice error !!!";
    fields.fruit.setError(errMsg);
    expect(fields.fruit.getError()).toEqual(errMsg);
  });

  it("calls onError callback if exists", () => {
    const spy = jest.fn();
    const schema = {
      fruit: {
        validator: str,
        onError: spy,
      },
    };
    const { fields } = powerform(initialValues, schema);
    const errMsg = "Nice error !!!";
    fields.fruit.setError(errMsg);
    expect(spy.mock.calls.length).toEqual(1);
    // expect(spy.mock.calls[0]).toMatchSnapshot();
  });

  it("wont call onError callback if 'skipError' is true", () => {
    const spy = jest.fn();
    const schema = {
      fruit: {
        validator: str,
        onError: spy,
      },
    };
    const { fields } = powerform(initialValues, schema);
    const errMsg = "Nice error !!!";
    fields.fruit.setError(errMsg, true);
    expect(spy.mock.calls.length).toEqual(0);
  });
});

describe("field.getError()", () => {
  it("returns error", () => {
    const { fields } = powerform({ fruit: "" }, { fruit: str });
    const errMsg = "Nice error !!!";
    fields.fruit.setError(errMsg);
    expect(fields.fruit.getError()).toEqual(errMsg);
  });
});

describe("field.isDirty()", () => {
  it("returns true for dirty field", () => {
    const { fields } = powerform({ fruit: "" }, { fruit: str });
    fields.fruit.setData("apple");
    expect(fields.fruit.isDirty()).toEqual(true);
  });

  it("returns false for non dirty field", () => {
    const { fields } = powerform({ fruit: "" }, { fruit: str });
    expect(fields.fruit.isDirty()).toEqual(false);
  });
});

describe("field.makePristine()", () => {
  it("sets previousValue and initialValue to currentValue", () => {
    const { fields } = powerform({ fruit: "" }, { fruit: str });
    fields.fruit.setData("apple");
    expect(fields.fruit.isDirty()).toEqual(true);

    fields.fruit.makePristine();
    expect(fields.fruit.isDirty()).toEqual(false);
  });

  it("empties error", () => {
    const { fields } = powerform({ fruit: "" }, { fruit: str });
    fields.fruit.validate();
    expect(fields.fruit.getError()).toEqual("This field is required");

    fields.fruit.makePristine();
    expect(fields.fruit.getError()).toEqual("");
  });
});

describe("field.reset()", () => {
  it("sets currentValue and previousValue to initialValue", () => {
    const { fields } = powerform({ fruit: "apple" }, { fruit: str });
    fields.fruit.setData("banana");
    expect(fields.fruit.getData()).toEqual("banana");

    fields.fruit.reset();
    expect(fields.fruit.getData()).toEqual("apple");
  });

  it("calls onChange callback", () => {
    const spy = jest.fn();
    const { fields } = powerform(
      { fruit: "apple" },
      {
        fruit: {
          validator: str,
          onChange: spy,
        },
      }
    );
    fields.fruit.setData("banana");
    expect(fields.fruit.getData()).toEqual("banana");

    fields.fruit.reset();
    expect(spy.mock.calls[1][0]).toEqual("apple");
  });

  it("empties error", () => {
    const { fields } = powerform({ fruit: "" }, { fruit: str });
    fields.fruit.validate();
    expect(fields.fruit.getError()).toEqual("This field is required");

    fields.fruit.reset();
    expect(fields.fruit.getError()).toEqual("");
  });
});

describe("field.setAndValidate()", () => {
  it("sets and validates field", () => {
    const { fields } = powerform({ fruit: "apple" }, { fruit: str });
    const error = fields.fruit.setAndValidate("");
    expect(error).toEqual("This field is required");
  });
});

new Field(decoder)
  .onValidate(...validators: FuncValidators[])
  .initialValue()
  .onChange()
  .onError()
  .onExport()
  .onInput()

function str(...validators: FuncValidators[]) {
  function isString(val: unknown): string {
    return JSON.stringify(val)
  }

  return new Field(isString).onValidate(validator...)
}

// TODO:
// {....} or Field().required(false)... ?
powerform({
  name: new Field(str).onValidate((val) => {})
});

powerform({
  name: str(min(1),max(3))
})

describe("powerform", () => {
  const initialValues = {
    username: "",
    name: "",
    password: "",
    confirmPassword: "",
  };
  it("returns form instance", () => {
    const form = powerform(initialValues, signupSchema);
    expect(form instanceof Form).toEqual(true);
  });

  it("attaches self to each field", () => {
    const form = powerform(initialValues, signupSchema);
    const { fields } = form;
    expect(fields.username.parent).toBe(form);
    expect(fields.password.parent).toBe(form);
    expect(fields.confirmPassword.parent).toBe(form);
  });

  it("attaches field name to each field", () => {
    const form = powerform(initialValues, signupSchema);
    const { fields } = form;
    expect(fields.username.fieldName).toEqual("username");
    expect(fields.password.fieldName).toEqual("password");
    expect(fields.confirmPassword.fieldName).toEqual("confirmPassword");
  });
});

describe("form.validate", () => {
  it("returns true if all the fields are valid", () => {
    const form = powerform(signupSchema);
    const data = {
      username: "ausername",
      name: "a name",
      password: "apassword",
      confirmPassword: "apassword",
    };
    form.setData(data);
    expect(form.validate()).toEqual(true);
  });

  it("returns false if any of the field is invalid", () => {
    const form = powerform(signupSchema);
    const data = {
      username: "ausername",
      name: "a name",
      password: "apassword",
      confirmPassword: undefined,
    };
    form.setData(data);
    expect(form.validate()).toEqual(false);
  });

  it("sets error", () => {
    const form = powerform(signupSchema);
    form.validate();
    expect(form.getError()).toEqual({
      confirmPassword: "This field is required.",
      name: "This field is required.",
      password: "This field is required.",
      username: "This field is required.",
    });
  });

  it("calls onError callback", () => {
    const config = { onError: jest.fn() };
    const form = powerform(signupSchema, config);
    form.validate();

    expect(config.onError.mock.calls.length).toEqual(1);
    expect(config.onError.mock.calls[0]).toMatchSnapshot();
  });

  it("respects config.stopOnError", () => {
    const schema = {
      username: { validator: required(true), index: 1 },
      name: { validator: required(true), index: 2 },
      password: { validator: required(true), index: 3 },
    };
    const config = { stopOnError: true };
    const form = powerform(schema, config);
    form.username.setData("a username");
    expect(form.validate()).toEqual(false);
    expect(form.username.getError()).toEqual(null);
    expect(form.name.getError()).toEqual("This field is required.");
    expect(form.password.getError()).toEqual(null);
  });
});

// describe("form.isValid", () => {
//   it("returns true if all the fields are valid", () => {
//     const form = powerform(signupSchema)
//     const data = {
//       username: 'ausername',
//       name: 'a name',
//       password: 'apassword',
//       confirmPassword: 'apassword'
//     }
//     form.setData(data)
//     expect(form.isValid()).toEqual(true)
//   })

//   it("returns false if any of the field is invalid", () => {
//     const form = powerform(signupSchema)
//     const data = {
//       username: 'ausername',
//       name: 'a name',
//       password: 'apassword',
//       confirmPassword: undefined
//     }
//     form.setData(data)
//     expect(form.isValid()).toEqual(false)
//   })

//   it("won't set error", () => {
//     const form = powerform(signupSchema)
//     form.isValid()
//     expect(form.getError()).toEqual({
//       "confirmPassword": null,
//       "name": null,
//       "password": null,
//       "username": null,
//     })
//   })

//   it("won't call onError callback", () => {
//     const config = {onError: jest.fn()}
//     const form = powerform(signupSchema, config)
//     form.isValid()

//     expect(config.onError.mock.calls.length).toEqual(0)
//   })
// })

// describe("form.setData", () => {
//   it("sets data of each field", () => {
//     const form = powerform(signupSchema)
//     const data = {
//       username: 'ausername',
//       password: 'apassword'
//     }
//     form.setData(data)

//     expect(form.username.getData()).toEqual(data.username)
//     expect(form.password.getData()).toEqual(data.password)
//   })

//   it("wont trigger update event from fields", () => {
//     const config = {
//       onChange: jest.fn()
//     }
//     const form = powerform(signupSchema, config)
//     const data = {
//       username: 'ausername',
//       name: 'A Name',
//       password: 'apassword',
//       confirmPassword: 'apassword'
//     }
//     form.setData(data)

//     expect(config.onChange.mock.calls.length).toEqual(1)
//     expect(config.onChange.mock.calls[0][0]).toEqual(data)
//   })
// })

// describe("form.getData", () => {
//   it("returns clean data from every fields", () => {
//     const afield = {
//       validator: required(true),
//       clean (value) {
//         return value.toUpperCase()
//       }
//     }

//     const schema = {
//       afield,
//       username: required(true),
//       password: required(true)
//     }
//     const form = powerform(schema)

//     form.afield.setData("apple")
//     form.username.setData("ausername")

//     const expected = {
//       username: "ausername",
//       password: null,
//       afield: "APPLE"
//     }
//     expect(form.getData()).toEqual(expected)
//   })
// })

// describe("form.getUpdates", () => {
//   it("returns key value pair of updated fields and their value", () => {
//     const form = powerform(signupSchema)
//     form.username.setData("ausername")
//     form.password.setData("apassword")

//     const expected = {
//       username: "ausername",
//       password: "apassword"
//     }
//     expect(form.getUpdates()).toEqual(expected)
//   })
// })

// describe("form.setError", () => {
//   it("sets error on each field", () => {
//     const form = powerform(signupSchema)
//     const errors = {
//       username: 'a error',
//       password: 'a error'
//     }

//     form.setError(errors)

//     expect(form.username.getError()).toEqual(errors.username)
//     expect(form.password.getError()).toEqual(errors.password)
//   })

//   it("calls onError callback only once", () => {
//     const config = {
//       onError: jest.fn()
//     }
//     const form = powerform(signupSchema, config)
//     const errors = {
//       username: 'a error',
//       password: 'a error'
//     }
//     form.setError(errors)

//     expect(config.onError.mock.calls.length).toEqual(1)
//     expect(config.onError.mock.calls[0]).toMatchSnapshot()
//   })
// })

// describe("form.getError", () => {
//   it("returns errors from every fields", () => {
//     const form = powerform(signupSchema)
//     form.username.setError("a error")
//     form.password.setError("a error")

//     const expected = {
//       username: "a error",
//       name: null,
//       password: "a error",
//       confirmPassword: null
//     }
//     expect(form.getError()).toEqual(expected)
//   })
// })

// describe("form.isDirty", () => {
//   it("returns true if any field's data has changed", () => {
//     const form = powerform(signupSchema)
//     form.username.setData('ausername')
//     expect(form.isDirty()).toEqual(true)
//   })

//   it("returns false if non of the field's data has changed", () => {
//     const form = powerform(signupSchema)
//     expect(form.isDirty()).toEqual(false)
//   })
// })

// describe("form.makePristine", () => {
//   it("makes all the fields prestine", () => {
//     const form = powerform(signupSchema)
//     const data = {
//       username: 'ausername',
//       password: 'apassword',
//       confirmPassword: 'password confirmation'
//     }
//     form.setData(data)
//     expect(form.isDirty()).toEqual(true)
//     form.makePristine()
//     expect(form.isDirty()).toEqual(false)
//   })

//   it("empties all the error fields and calls onError callback only once", () => {
//     const config = {
//       onError: jest.fn()
//     }
//     const form = powerform(signupSchema, config)
//     const data = {
//       username: 'ausername'
//     }
//     form.setData(data)
//     form.validate() // first call
//     expect(form.isDirty()).toEqual(true)
//     expect(form.getError()).toEqual({
//       "confirmPassword": "This field is required.",
//       "name": "This field is required.",
//       "password": "This field is required.",
//       "username": null
//     })

//     form.makePristine() // second call
//     expect(form.isDirty()).toEqual(false)
//     expect(form.getError()).toEqual({
//       "confirmPassword": null,
//       "name": null,
//       "password": null,
//       "username": null
//     })
//     expect(form.getData()).toEqual({
//       "confirmPassword": null,
//       "name": null,
//       "password": null,
//       "username": "ausername"
//     })
//     expect(config.onError.mock.calls.length).toEqual(2)
//   })
// })

// describe("form.reset", () => {
//   it("resets all the fields and calls onChange callback only once", () => {
//     const config = {
//       onChange: jest.fn()
//     }
//     const form = powerform(signupSchema, config)
//     const data = {
//       username: 'ausername',
//       name: 'a name',
//       password: 'apassword',
//       confirmPassword: 'password confirmation'
//     }
//     form.setData(data) // first trigger
//     form.reset() // second trigger

//     const expected = {
//       username: null,
//       name: null,
//       password: null,
//       confirmPassword: null
//     }
//     expect(form.getData()).toEqual(expected)
//     expect(config.onChange.mock.calls.length).toEqual(2)
//   })

//   it("resets all the errors and calls onError callback only once", () => {
//     const config = {
//       onError: jest.fn()
//     }
//     const form = powerform(signupSchema, config)
//     form.validate() // 1st trigger
//     form.reset() // 2nd triggter

//     const expected = {
//       username: null,
//       name: null,
//       password: null,
//       confirmPassword: null
//     }
//     expect(form.getError()).toEqual(expected)
//     expect(config.onError.mock.calls.length).toEqual(2)
//   })
// })

// describe("form.triggerOnChange", () => {
//   it("calls callback with value and form instance", () => {
//     const config = {
//       onChange: jest.fn()
//     }
//     const form = powerform(signupSchema, config)
//     form.setData({username: 'ausername'})
//     form.triggerOnChange()
//     expect(config.onChange.mock.calls.length).toEqual(2)
//     expect(config.onChange.mock.calls[1]).toMatchSnapshot()
//   })

//   it("won't call onChange callback if 'getNotified' is false", () => {
//     const config = {
//       onChange: jest.fn()
//     }
//     const form = powerform(signupSchema, config)
//     form.setData({username: 'ausername'})
//     form.toggleGetNotified()
//     form.triggerOnChange()
//     expect(config.onChange.mock.calls.length).toEqual(1)
//   })
// })

// describe("form.triggerOnError", () => {
//   it("calls callback with value and form instance", () => {
//     const config = {
//       onError: jest.fn()
//     }
//     const form = powerform(signupSchema, config)
//     form.setError({username: 'an error'})
//     form.triggerOnError()
//     expect(config.onError.mock.calls.length).toEqual(2)
//     expect(config.onError.mock.calls[1]).toMatchSnapshot()
//   })

//   it("won't call onError callback if 'getNotified' is false", () => {
//     const config = {
//       onError: jest.fn()
//     }
//     const form = powerform(signupSchema, config)
//     form.validate()
//     form.toggleGetNotified()
//     form.triggerOnError()
//     expect(config.onError.mock.calls.length).toEqual(1)
//   })
// })

// describe("Usage", () => {
//   it('works with normal validation', () => {
//     const data = {
//       username: 'a username',
//       name: 'a name'
//     }
//     const form = powerform(signupSchema, {data})

//     var expected = {
//       username: 'a username',
//       name: 'A Name',
//       password: null,
//       confirmPassword: null
//     }
//     expect(form.getData()).toEqual(expected)

//     expect(form.validate()).toEqual(false)
//     var expected = {
//       username: null,
//       name: null,
//       password: 'This field is required.',
//       confirmPassword: 'This field is required.'
//     }
//     expect(form.getError()).toEqual(expected)

//     form.setData({password: 'a password', confirmPassword: 'a password'})
//     expect(form.isValid()).toEqual(true)
//   })
// })
