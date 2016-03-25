# Introduction
A form model for [Mithril.js](https://github.com/lhorie/mithril.js/). Used to be part of [mithril-ui](https://github.com/ludbek/mithril-ui).

# Installation
npm install mithril-form

# Validation
`mithril-form` uses [validate.js](https://validatejs.org/) for validation.

# Quick walk-through
```javascript
> import Form from "mithril-form"

// create form
> let form = Form({
.. "username": {presence: true},
.. "password": {presence: true},
.. "confirmPassword": {equality: "password"}})

// assign values to fields
> form.username("ausername")
> form.password("apassword")
> form.confirmPassword("bpassword")

// per field validation
> form.username.isValid()
true
> form.confirmPassword.isValid()
false
> form.confirmPassword.errors()
[ 'Confirm password is not equal to password' ]

// validate all the fields at once
> form.isValid()
false
> form.errors()
{ username: undefined,
  password: undefined,
  confirmPassword: [ 'Confirm password is not equal to password' ] }
```

# API
## Creating new form
```javascript
let form = Form({name: {presence: true}})
```
## Set default value
```javascript
let form = Form({name: {presence: true, default: "aname"}})
form.name() // "aname"
```
## Form methods
### .isValid()
```javascript
form.name("")

// check validity without setting errors
form.isValid(false) // false
form.errors() // {name: ""}

// check validity and set errors
form.isValid()
form.errors() // {name: ['Name can\'t be blank]}
```
### .isDirty()
Returns `true` if form has been modified else returns `false`.

### .reset()
Resets all the fields.

### .errors()
Gets or sets errors on fields.
One should either call `.isValid()` or `.setAndValidate()` to set errors.
```javascript
form.name("")
form.isValid() // false
form.errors() // {name: ['Name can\'t be blank]}
form.errors({name: ["a error"]})
form.errors() // {name: ["a error"]}
```
### .data()
Returns the key-value paris of fields and their respective values.

## Per field methods
Field itself is getter/setter.
```javascript
form.name("bname")
form.name() // bname
```

### .isValid()
Same as `form.isValid`

### .isDirty()
Same as `form.isDirty()`

### .reset()
Same as `form.reset()`

### .errors()
Gets or sets errors.
```javascript
form.name("")
form.name.isValid() // false
form.name.errors() // ['Name can\'t be blank]
form.name.errors(['a error'])
form.name.errors() // ['a error']
```

### .setAndValidate()
It sets the value as well as validates the field.
```javascript
form.name.setAndValidate("")
form.errors() // ['Name can\'t be blank]
```

# Using it with Mithril.js
```javascript
m('field',
  m('input', {
    onkeyup: m.withAttr('value', form.name),
    onchange: form.name.isValid},
  m('error', form.name.errors()[0])))
```

