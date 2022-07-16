import { Form, Field, powerform } from "./index"

function required(val: string): [string, string] {
  if (val === "") return [val, "This field is required"]
  return [val, ""]
}

describe("Form", () => {
  it("works", () => {
    const initialValues = {
      email: "",
      password: "",
      confirmPassword: ""
    }
    const form = powerform(
      initialValues,
      {
        email: required,
        password: required,
        confirmPassword: required
      }
    )
    expect(form.isValid()).toEqual(false)
    let errors = initialValues
    expect(form.getError()).toEqual(initialValues)

    expect(form.validate()).toEqual(false)
    errors = {
      email: "This field is required",
      password: "This field is required",
      confirmPassword: "This field is required"
    }
    expect(form.getError()).toEqual(errors)
  })
})
