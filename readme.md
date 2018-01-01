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
console.log(form.setError())
> { username: undefined,
  password: undefined,
  confirmPassword: "Password and confirmation does not match." }
```

## API
### Field
#### Field.new(config?: object)
##### Config schema
```
{
  default?: any,
  debounce?: number,
  onChange(value: any, error: any)?: function
}
```
#### Field.clean(value: any)
#### Field.modify(newValue: any, oldValue: any)
#### Field.setData(value: any)
#### Field.getData()
#### Field.isValid(skipAttachError?: boolean)
#### Field.setError(error: string)
#### Field.getError()
#### Field.isDirty()
#### Field.makePrestine()
#### Field.reset()
#### Field.setAndValidate(value: any)

### Form
#### Form.new(config?: object)
##### Config schema
```
{
  default: object,
  onChange(data: object, error: object): function
}
```
#### Form.setData(data: object)
#### Form.getData()
#### Form.getUpdates()
#### Form.setError(errors: object)
#### Form.getError()
#### Form.isDirty()
#### Form.makePrestine()
#### Form.reset()
#### Form.isValid(skipAttachError?: boolean)

## Usage
### Set default value
### Debounce
### Project data/error changes at field
### Project data/error changes at form

## Example
### React
