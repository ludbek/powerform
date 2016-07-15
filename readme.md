# Introduction
A form model which can be used in apps with or without frameworks like Mithril, React, etc.

# Installation
## npm
`npm install powerform`
## Bower
`bower install powerform`

# Quick walk-through
```javascript
// es6
> import form from "powerform"

// node
var form = require("powerform")

// If using bower powerform is available as global variable

// create form
var form = powerform({
	username: function (value) {
  	if(!value) return "This field is required"
  },
  password: function (value) {
  	if(value.length < 8) return "This field must be at least 8 characters long."
  },
  confirmPassword: function (value, dform) {
  	if (value !== dform.password) return "Password and confirmation does not match."
  }
})

// assign values to fields
> form.username("ausername")
> form.password("apassword")
> form.confirmPassword("bpassword")

// per field validation
> form.username.isValid()
true
> form.password.isValid()
true
> form.confirmPassword.isValid()
false
> form.confirmPassword.errors()
"Password and confirmation does not match."

// validate all the fields at once
> form.isValid()
false
> form.errors()
{ username: undefined,
  password: undefined,
  confirmPassword: "Password and confirmation does not match." }
```

# API
## Creating new form
```javascript
var form = powerform({
  name: function (value) {
    if (!value) return "This field is required."
  }
})
```
## Set default value
```javascript
var form = powerform({
  name: {
    default: "aname",
    validator: function (value) {
      if(!value) return "This field is required."
    }
  }
})

form.name() // "aname"
```
## Form methods
### .isValid()
```javascript
form.name("")

// check validity without setting errors
form.isValid(false) // false
form.errors() // {name: undefined}

// check validity and set errors
form.isValid()
form.errors() // {name: "This field is required."}
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
form.errors() // {name: "This field is required."}
form.errors({name: "a error"})
form.errors() // {name: "a error"}
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
form.name.errors() // "This field is required."
form.name.errors('a error')
form.name.errors() // 'a error'
```

### .setAndValidate()
It sets the value as well as validates the field.
```javascript
form.name.setAndValidate("")
form.errors() // "This field is required."
```

## Modifier and Cleaner
Use `modifier` and `cleaner` to decorate and clean input data respectively.
Modifier come handy in situations like automatically inserting `-`(dash) inbetween credit card input,
capitaling user's name, etc. Cleaner is used for cleaning modified data if necessary.

`isValid` uses `cleaner` before validating the fields.

### Uage
```javascript
var form = new Form({fullName: {modifier: function (newValue, oldValue) {
                                  ...
                                  return modifiedValue;
                                },
                                cleaner: function (value) {
                                  ...
                                  return cleanedValue;
                                }}});

form.fullName("super man")
form.fullName() // modified name
form.data() // {fullName: cleaned name}
```
