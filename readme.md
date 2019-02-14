[![Build Status](https://travis-ci.org/ludbek/powerform.svg?branch=master)](https://travis-ci.org/ludbek/powerform)

<img src="https://user-images.githubusercontent.com/8296449/30893678-3e1702a8-a35f-11e7-8f6c-965ffe88cf40.png" width=400>

Logo by [Anand](https://www.behance.net/mukhiyaanad378)

## Showcase

- [Mithril](https://codesandbox.io/s/nr4lxn4ovm)
- [React](https://codesandbox.io/s/625pjy4q5w)

## Breaking changes
v3 introduces significant changes which are not backward compatible with v2.
Please checkout the [change log](CHANGE_LOG.txt).

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
import {Field, Form, ValidationError} from "powerform"

class UsernameField extends Field {
  validate(value, allValues) {
    if(!value) {
      throw new ValidationError("This field is required.")
    }
  }
}

class PasswordField extends Field {
  validate(value, allValues) {
    if (!value) throw new ValidationError("This field is required.")
    if(value.length < 8) {
      throw new ValidationError("This field must be at least 8 characters long.")
    }
  }
}

class ConfirmPasswordField extends Field {
  validate(value, allValues) {
    if (value !== allValues[this.config.passwordField]) {
      throw new ValidationError("Passwords do not match.")
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
### Form
#### Form.new(config?: object)
Creates and returns a `Form` instance.

```javascript
// reusing the fields and form at walkthrough
let f = SignupForm.new()
console.log(f instanceof Form)
> true
```

##### Config schema
```
{
  data: object,
  onChange(data: object, form: Form): function,
  onError(error: object, form: Form): function,
  stopOnError: boolean
}
```

##### Set initial values of field
Pass an object at `config.data` to set initial field values.

```javascript
const config = {
  data: {
    username: 'a username',
    password: 'a password'
  }
}
let f = SignupForm.new(config)
console.log(f.username.getData())
> 'a username'
console.log(f.password.getData())
> 'a password'
```

##### Track changes in data and error
Changes to values and errors of fields can be tracked through `config.onChange` callback.

```javascript
const config = {
  onChange: (data, form) => {
    console.log(data)
  },
  onError: (error, form) => {
    console.log(error)
  }
}

let f = SignupForm.new(config)
f.username.setData('a username')
// logs data
> {
  username: 'a username',
  password: null,
  confirmPassword: null
}
f.password.isValid()
// logs changes to error
> {
  username: null,
  password: 'This field is required.',
  confirmPassword: null
}
```

##### Validate one field at a time
It is possible to stop validation as soon as one of the fields fails.
To enable this mode of validation set `config.stopOnError` to `true`.
One can control the order at which fields are validated by supplying `index` to fields.

```javascript
class LoginForm extends Form {
  password = PasswordField.new({index: 2})
  username = UsernameField.new({index: 1})
}

const f = LoginForm.new({stopOnError: true})

console.log(f.isValid())
>> false

console.log(f.getError())
>> {username: "This field is required."}

```

#### Form.setData(data: object)
Sets value of fields of a form.

```javascript
let f = SignupForm.new()
let data = {
  username: 'a username',
  password: 'a password'
}
f.setData(data)

console.log(f.username.getData())
> 'a username'
console.log(f.password.getData())
> 'a password'
console.log(f.confirmPassword.getData())
> null
```

#### Form.getData()
Returns key value pair of fields and their corresponding values.

```javascript
let f = SignupForm.new()
let data = {
  username: 'a username',
  password: 'a password'
}
f.setData(data)

console.log(f.getData())
> {
  username: 'a username',
  password: 'a password',
  confirmPassword: null
}
```

#### Form.getUpdates()
Returns key value pair of updated fields and their corresponding values.
The data it returns can be used for patching a resource over API.

```javascript
class StringField extends Field {
  validate(value, allValues) {
    if (!value) throw new ValidationError("This field is required.")
  }
}

class UserForm extends Form {
  name = StringField.new()
  address = StringField.new()
  username = UsernameField.new()
}

let f = UserForm.new()
let data = {
  name: 'a name',
  address: 'an address'
}
f.setData(data)

console.log(f.getUpdates())
> {
  name: 'a name',
  address: 'an address'
}
```

#### Form.setError(errors: object)
Sets error of fields in a form.

```javascript
let f = SignupForm.new()
const errors = {
  username: "Invalid username.",
  password: "Password is too common."
}
f.setError(errors)

console.log(f.username.getError())
> "Invalid username."

console.log(f.password.getError())
> "Password is too common."

console.log(f.confirmPassword.getError())
> null
```

#### Form.getError()
Returns key value pair of fields and their corresponding errors.

```javascript
let f = SignupForm.new()
f.password.setData('1234567')
f.confirmPassword.setData('12')
f.isValid()

console.log(f.getError())
> {
  username: "This field is required.",
  password: "This field must be at least 8 characters long.",
  confirmPassword: "Passwords do not match."
}
```

#### Form.isDirty()
Returns `true` if value of one of the fields in a form has been updated.
Returns `false` if non of the fields has been updated.

```javascript
let f = SignupForm.new()

console.log(f.isDirty())
> false

f.username.setData('a username')
console.log(f.isDirty())
> true
```

#### Form.makePristine()
Sets initial value to current value in every fields.

```javascript
let f = SignupForm.new()
f.username.setData('a username')

console.log(f.isDirty())
> true

f.makePristine()
console.log(f.isDirty())
> false
console.log(f.username.getData())
> 'a username'
```

#### Form.reset()
Resets all the fields of a form.

```javascript
let f = SignupForm.new()
f.username.setData('a username')
f.password.setData('a password')
console.log(f.getData())
> {
  username: 'a username',
  password: 'a password',
  confirmPassword: null
}

f.reset()
console.log(f.getData())
> {
  username: null,
  password: null,
  confirmPassword: null
}
```

#### Form.isValid(skipAttachError?: boolean)
Returns `true` if all fields of a form are valid.
Returns `false` if one of the fields in a form is invalid.
It sets field errors if the form is invalid.

```javascript
let f = SignupForm.new()
f.password.setData('1234567')

console.log(f.getError())
> {
  username: null,
  password: null,
  confirmPassword: null
}

console.log(f.isValid())
> false

console.log(f.getError())
> {
  username: "This field is required.",
  password: "This field must be at least 8 characters long.",
  confirmPassword: "Passwords do not match."
}
```

To check form validity without setting the errors pass `skipAttachError` to `Form.isValid`.
```javascript
let f = SignupForm.new()
f.password.setData('1234567')

console.log(f.getError())
> {
  username: null,
  password: null,
  confirmPassword: null
}

console.log(f.isValid(true))
> false

console.log(f.getError())
> {
  username: null,
  password: null,
  confirmPassword: null
}
```

### Field
`Field` should be attached to a form.
Checkout the examples below.

#### Field.new(config?: object)
Creates and returns a field instance.

##### Config schema
```
{
  default?: any,
  debounce?: number,
  onChange(value: any, field: Field)?: function
  onError(error: any, field: Field)?: function
}
```

```javascript
class NumberField extends Field {}
let f = NumberField.new()
console.log(f instanceof Field)
> true
```

##### Set default value
A field can have default value.

```javascript
class UserForm extends Form {
  // assuming UsernameField is defined somewhere
  username = UsernameField.new({default: 'orange'})
}

let f = UserForm.new()
console.log(f.username.getData())
> 'orange'
```

##### Trance changes in value and error
Changes in value and error of a field can be tracked through `config.onChange` and `config.onError` callbacks.

```javascript
function logData(data, field) {
  console.log('data: ', data)
}

function logError(data, field) {
  console.log('error: ', error)
}

class UsernameField extends Field {
  validate(value, allValues) {
    if (!value) throw new ValidationError("This field is required.")
  }
}

class UserForm extends Form {
  // assuming UsernameField is defined somewhere
  username = UsernameField.new({default: 'orange', onChange: logData, onError: logError})
}

let f = UserForm.new()
f.username.isValid()
> "error: " "This field is required."

f.username.setData('orange')
> "data: " "orange"

f.username.isValid()
> "error: " null
```

##### Debounce change in value
Changes in data can be debounced.

```javascript
// reusing above UsernameField and log function
class UserForm extends Form {
  username = UsernameField.new(debounce: 1000, onChange: logData)
}

let f = UserForm.new()
f.username.setData("banana")
// after 1 second
> "data: " "banana"
```

#### Field.setData(value: any)
Sets field value.

```javascript
class StringField extends Field {}

class UserForm extends Form {
  name = StringField.new()
}

let f = UserForm.new()
f.name.setData('a name')
console.log(f.name.getData('a name'))
> 'a name'
```

#### Field.getData()
Returns field value.

#### Field.modify(newValue: any, oldValue: any)
Override this method to modify user input.
Example usage -

- capitalize user name as user types
- insert space or dash as user types card number

```javascript
class NameField extends Field {
  validate(value, all) {
    if (!value) throw new ValidationError(`"${this.fieldName}" is required.`)
  }

  modify(value) {
    if (!value) return null
    return value.replace(/(?:^|\s)\S/g, s => s.toUpperCase())
  }
}

let nameField = NameField.new()
nameField.setData('first last')
console.log(nameField.getData())
> 'First Last'
```

#### Field.clean(value: any)
Override this method to do last minute cleaning of data.
`Form.getData()` uses this method to get clean data.
It is useful for situations where value in a view should be different to
the value in stores.

```javascript
Class CardField extends Field {
  modify(newVal, oldVal) {
    return newVal.length === 16
      ? newCard.split("-").join("").replace(/(\d{4})/g, "$1-").replace(/(.)$/, "")
      : newCard.split("-").join("").replace(/(\d{4})/g, "$1-")
  }

  clean(value) {
    return card.split("-").join("")
  }
}

class AForm extends Form {
  card = CardField.new()
}

let aform = AForm.new()

aform.card.setData("1111222233334444")
console.log(aform.card.getData())
> "1111-2222-3333-4444"
console.log(aform.getData())
> {card: "1111222233334444"}
```

### Field.validate(value: any, allValues: object)
Implement this method to validate field data.
It should return an error message in case of invalid value.
This method is called by `Form.isValid()`.

```javascript
class PasswordField extends Field {
  validate(value, allValues) {
    if(!value) throw new ValidationError(`'${this.fieldName}' is required.`)
    if (value.length < 8) throw new ValidationError(`'${this.fieldName}' must be at least 8 characters long.`)
  }
}

class LoginForm extends Form {
  password = PasswordField.new()
}

let f = LoginForm.new
f.password.isValid() // false
console.log(f.password.getError())
> "'password' is required."

f.password.setData("1234567")
f.password.isValid() // false
console.log(f.password.getError())
> "'password' must be at least 8 characters long."

f.password.setData("12345678")
f.password.isValid()
console.log(f.password.getError())
> null
```

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

#### Field.makePristine()
Sets initial value to current value.

#### Field.reset()
Sets current value to initial value.

#### Field.setAndValidate(value: any)
Sets and validates a field. It internally calls `Field.setData()` and `Field.validate()`.
