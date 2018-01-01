[![Build Status](https://travis-ci.org/ludbek/powerform.svg?branch=master)](https://travis-ci.org/ludbek/powerform)

<img src="https://user-images.githubusercontent.com/8296449/30893678-3e1702a8-a35f-11e7-8f6c-965ffe88cf40.png" width=400>

Logo by [Anand](https://www.behance.net/mukhiyaanad378)

## Introduction
A tiny form model which can be used in apps with or without frameworks like [Mithril](https://github.com/MithrilJS/mithril.js/), [React](https://github.com/facebook/react), etc.

### Features
...

## Installation
### yarn
`yarn add powerform`

### npm
`npm install powerform`

## Quick walk-through
```javascript
// es6
import {Field, Form} from "powerform"

class UsernameField extends Field {
  validate(value, allValues) {
    if(!value) {
      return "This field is required."
    }
  }
}

class PasswordField extends Field {
  validate(value, allValues) {
    if(value.length < 8) {
      return "This field must be at least 8 characters long."
    }
  }
}

class ConfirmPasswordField extends Field {
  validate(value, allValues) {
    if (value !== allValues[this.config.passwordField]) {
      return "Passwords do not match."
    }
  }
}

class SignupForm extends Form {
  username = UsernameField.new()
  password = PasswordField.new()
  confirmPassword = ConfirmPasswordField.new({passwordField: 'password'})
}

const form = SignupForm.new()

// assign values to fields
form.username.setData("ausername")
form.password.setData("apassword")
form.confirmPassword.setData("bpassword")

// per field validation
console.log(form.username.isValid())
> true
console.log(form.password.isValid())
> true
console.log(form.confirmPassword.isValid())
> false
console.log(form.confirmPassword.getError())
> "Passwords do not match."

// validate all the fields at once
console.log(form.isValid())
> false
console.log(form.getError())
> { username: undefined,
  password: undefined,
  confirmPassword: "Password and confirmation does not match." }
```

## API
### Field
#### Field.new(config?: object)
Creates and returns a field instance.

##### Config schema
```
{
  default?: any,
  debounce?: number,
  onChange(value: any, error: any)?: function
}
```

#### Field.clean(value: any)
Override this method to do last minute cleaning of data.

#### Field.modify(newValue: any, oldValue: any)
Override this method to modify user input.

#### Field.setData(value: any)
Sets field value.

#### Field.getData()
Returns field value.

### Field.validate(value: any, allValues: object)
Implement this method to validate field data.
It should return an error message in case of invalid value.
This method is called by `Form.isValid()`.

#### Field.isValid(skipAttachError?: boolean)
Returns `true` if `Field.validate()` returns nothing.
Returns `false` if `Field.validate()` returns an error.

#### Field.setError(error: string)
Sets field error.

#### Field.getError()
Returns field error.
Call this method after validating the field.

#### Field.isDirty()
Returns `true` if value of a field is changed else returns `false`.

#### Field.makePrestine()
Sets initial value to current value.

#### Field.reset()
Sets current value to initial value.

#### Field.setAndValidate(value: any)
Sets and validates a field. It internally calls `Field.setData()` and `Field.validate()`.

### Form
#### Form.new(config?: object)
Creates and returns a form instance.

##### Config schema
```
{
  default: object,
  onChange(data: object, error: object): function
}
```

#### Form.setData(data: object)
Sets value of fields of a form.

#### Form.getData()
Returns key value pair of fields and their corresponding values.

#### Form.getUpdates()
Returns key value pair of updated fields and their corresponding values.

#### Form.setError(errors: object)
Sets error of fields in a form.

#### Form.getError()
Returns key value pair of fields and their corresponding errors.

#### Form.isDirty()
Returns `true` if value of one of the fields in a form has been updated.
Returns `false` if non of the fields has been updated.

#### Form.makePrestine()
Sets initial value to current value in every fields.

#### Form.reset()
Resets all the fields of a form.

#### Form.isValid(skipAttachError?: boolean)
Returns `true` if all fields of a form are valid.
Returns `false` if one of the fields in a form is invalid.

## Usage
### Set default value
### Debounce
### Project data/error changes at field
### Project data/error changes at form

## Example
### React
### Mithril
