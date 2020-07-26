[![Build Status](https://travis-ci.org/ludbek/powerform.svg?branch=master)](https://travis-ci.org/ludbek/powerform)

<img src="https://user-images.githubusercontent.com/8296449/30893678-3e1702a8-a35f-11e7-8f6c-965ffe88cf40.png" width=400>

Logo by [Anand](https://www.behance.net/mukhiyaanad378)


## Introduction
A tiny super portable form model which can be used in apps with or without frameworks like [React](https://github.com/facebook/react).

## Showcase
[Vanilla JS](https://codesandbox.io/s/powerform-vanilla-js-ug2sx)

[React](https://codesandbox.io/s/powerform-react-17gqu)

[Mithril](https://codesandbox.io/s/powerform-mithril-pdrl1?file=/src/index.js)

## Breaking changes
v4 introduces significant changes which are not backward compatible with v3.
Please checkout the [change log](CHANGE_LOG.txt).

## Installation
### yarn
`yarn add powerform`

### npm
`npm install powerform`

## Quick walk-through
```javascript
// es6
import { powerform } from "powerform"
import { required, minLength, equalsTo } from 'validatex'

const schema  = {
  username: required(true),
  password: [required(true), minLength(8)],
  confirmPassword: [required(true), equalsTo('password')]
}

const form = powerform(schema)

// assign values to fields
form.username.setData("ausername")
form.password.setData("apassword")
form.confirmPassword.setData("bpassword")

// per field validation
console.log(form.username.validate())
> true
console.log(form.password.validate())
> true
console.log(form.confirmPassword.validate())
> false
console.log(form.confirmPassword.getError())
> "Passwords do not match."

// validate all the fields at once
console.log(form.validate())
> false
console.log(form.getError())
> { username: undefined,
  password: undefined,
  confirmPassword: "Password and confirmation does not match." }
```

## API
### Form
#### powerform(schema, config?: object)
Returns a form.

```javascript
// reusing the schema from walkthrough
const form = powerform(schema)
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
const form = powerform(schema, config)
console.log(form.username.getData())
> 'a username'
console.log(form.password.getData())
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

const form = powerform(schema, config)
form.username.setData('a username')
// logs data
> {
  username: 'a username',
  password: null,
  confirmPassword: null
}
form.password.validate()
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
const loginSchema = {
  password: {validator: required(true), index: 2}
  username: {validator: required(true), index: 1}
}
const form = powerform(loginSchema, {stopOnError: true})

console.log(form.validate())
>> false

console.log(form.getError())
>> {username: "This field is required."}

```

#### form.setData(data: object)
Sets value of fields of a form.

```javascript
const form = powerform(schema)
let data = {
  username: 'a username',
  password: 'a password'
}
form.setData(data)

console.log(form.username.getData())
> 'a username'
console.log(form.password.getData())
> 'a password'
console.log(form.confirmPassword.getData())
> null
```

#### form.getData()
Returns key value pair of fields and their corresponding values.

```javascript
const form = powerform(schema)
let data = {
  username: 'a username',
  password: 'a password'
}
form.setData(data)

console.log(form.getData())
> {
  username: 'a username',
  password: 'a password',
  confirmPassword: null
}
```

#### form.getUpdates()
Returns key value pair of updated fields and their corresponding values.
The data it returns can be used for patching a resource over API.

```javascript
const userFormSchema = {
  name: required(true),
  address: required(true),
  username: required(true)
}

const form = powerform(userFormSchema)
let data = {
  name: 'a name',
  address: 'an address'
}
form.setData(data)

console.log(form.getUpdates())
> {
  name: 'a name',
  address: 'an address'
}
```

#### form.setError(errors: object)
Sets error of fields in a form.

```javascript
const form = powerform(schema)
const errors = {
  username: "Invalid username.",
  password: "Password is too common."
}
form.setError(errors)

console.log(form.username.getError())
> "Invalid username."

console.log(form.password.getError())
> "Password is too common."

console.log(form.confirmPassword.getError())
> null
```

#### form.getError()
Returns key value pair of fields and their corresponding errors.

```javascript
const form = powerform(schema)
form.password.setData('1234567')
form.confirmPassword.setData('12')
form.validate()

console.log(form.getError())
> {
  username: "This field is required.",
  password: "This field must be at least 8 characters long.",
  confirmPassword: "Passwords do not match."
}
```

#### form.isDirty()
Returns `true` if value of one of the fields in a form has been updated.
Returns `false` if non of the fields has been updated.

```javascript
const form = powerform(schema)

console.log(form.isDirty())
> false

form.username.setData('a username')
console.log(f.isDirty())
> true
```

#### form.makePristine()
Sets initial value to current value in every fields.

```javascript
const form = powerform(schema)
form.username.setData('a username')

console.log(form.isDirty())
> true

form.makePristine()
console.log(form.isDirty())
> false
console.log(form.username.getData())
> 'a username'
```

#### form.reset()
Resets all the fields of a form.

```javascript
const form = powerform(schema)
form.username.setData('a username')
form.password.setData('a password')
console.log(form.getData())
> {
  username: 'a username',
  password: 'a password',
  confirmPassword: null
}

form.reset()
console.log(form.getData())
> {
  username: null,
  password: null,
  confirmPassword: null
}
```

#### form.isValid()
Returns `true` if all fields of a form are valid.
Returns `false` if one of the fields in a form is invalid.
Unlike `form.validate()` it does not set the error.

```javascript
const form = powerform(schema)
form.password.setData('1234567')

console.log(form.isValid())
> false

console.log(form.getError())
> {
  username: null,
  password: null,
  confirmPassword: null
}

```

### Field
Every keys in a schema that is passed to `powerform` is turned into a Field. We do not need to directly instanciate it.

#### Field(config?: object| function | [function])
Creates and returns a field instance.

##### Config schema
```
{
  validator: function | [function],
  default?: any,
  debounce?: number,
  onChange(value: any, field: Field)?: function
  onError(error: any, field: Field)?: function
}
```

##### Set default value
A field can have default value.

```javascript
const form = powerform({
  username: {validator: required(true), default: 'orange'}
})

console.log(form.username.getData())
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

const form = powerform({
  username: {
    validator: required(true),
    default: 'orange',
    onChange: logData,
    onError: logError
  }
})
form.username.validate()
> "error: " "This field is required."

form.username.setData('orange')
> "data: " "orange"

form.username.validate()
> "error: " null
```

##### Debounce change in value
Changes in data can be debounced.

```javascript
const form = powerform({
  username: {
    validator: required(true),
    default: 'orange',
    onChange: logData,
    onError: logError
  }
})

form.username.setData("banana")
// after 1 second
> "data: " "banana"
```

#### Field.setData(value: any)
Sets field value.

```javascript
const form = powerform({
  name: required(true)
})
form.name.setData('a name')
console.log(form.name.getData())
> 'a name'
```

#### Field.getData()
Returns field value.

#### Field.modify(newValue: any, oldValue: any)
Modifies user's input value.
Example usage -

- capitalize user name as user types
- insert space or dash as user types card number

```javascript
const form = powerform({
  name: {
    validator: required(true),
    modify(value) {
      if (!value) return null
      return value.replace(/(?:^|\s)\S/g, s => s.toUpperCase())
    }
  }
})

form.name.setData('first last')
console.log(form.name.getData())
> 'First Last'
```

#### Field.clean(value: any)
Cleans the value.
`form.getData()` uses this method to get clean data.
It is useful for situations where value in a view should be different to
the value in stores.

```javascript
const form = powerform({
  card: {
    validator: required(true),
    modify(newVal, oldVal) {
      return newVal.length === 16
        ? newCard.split("-").join("").replace(/(\d{4})/g, "$1-").replace(/(.)$/, "")
        : newCard.split("-").join("").replace(/(\d{4})/g, "$1-")
    },
    clean(value) {
      return card.split("-").join("")
    }
  }
})

form.card.setData("1111222233334444")
console.log(form.card.getData())
> "1111-2222-3333-4444"
console.log(form.getData())
> {card: "1111222233334444"}
```

### field.validate(value: any, allValues: object)

#### field.isValid()
Returns `true` or `false` based upon the validity.

#### field.setError(error: string)
Sets field error.

#### field.getError()
Returns field error.
Call this method after validating the field.

#### field.isDirty()
Returns `true` if value of a field is changed else returns `false`.

#### field.makePristine()
Marks a field to be untouched.
It sets current value as initial value.

#### field.reset()
It resets the field.
Sets initial value as current value.

#### field.setAndValidate(value: any)
Sets and validates a field. It internally calls `Field.setData()` and `Field.validate()`.
