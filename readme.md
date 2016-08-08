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
> import powerform from "powerform"

// node
var powerform = require("powerform")

// browser
// Include /dist/powerform.min.js at script tag.

// create form
var form = powerform({
  username: function (value) {
    if(!value) return "This field is required"
  },
  password: function (value) {
    if(value.length < 8) return "This field must be at least 8 characters long."
  },
  confirmPassword: function (value, dform) {
    if (value !== dform.password()) return "Password and confirmation does not match."
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
> form.confirmPassword.error()
"Password and confirmation does not match."

// validate all the fields at once
> form.isValid()
false
> form.error()
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

## Optional fields
```javascript
var form = powerform({
  name: {
    required: false,
    validator: function (value) {
      if(!value) return "This field is required."
    }
  }
})

form.name("");
form.name.isValid() // true
```

## Form methods
### .isValid()
```javascript
form.name("")

// check validity without setting errors
form.isValid(false) // false
form.error() // {name: undefined}

// check validity and set errors
form.isValid()
form.error() // {name: "This field is required."}
```
### .isDirty()
Returns `true` if form has been modified else returns `false`.

### .reset()
Resets all the fields.

### .error()
Gets or sets errors on fields.
One should either call `.isValid()` or `.setAndValidate()` to set errors.
```javascript
form.name("")
form.isValid() // false
form.error() // {name: "This field is required."}
form.error({name: "a error"})
form.error() // {name: "a error"}
```
### .data()
Returns the key-value pairs of fields and their respective values.

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

### .error()
Gets or sets errors.
```javascript
form.name("")
form.name.isValid() // false
form.name.error() // "This field is required."
form.name.error('a error')
form.name.error() // 'a error'
```

### .setAndValidate()
It sets the value as well as validates the field.
```javascript
form.name.setAndValidate("")
form.error() // "This field is required."
```

## Modifier
Use `modifier` to decorate input data. It comes handy in situations like capitaling user's name,
inserting `-`(dash) inbetween credit card input, etc.

```javascript
var form = powerform({
	fullName: {
		validator: function (value) {
			if(!value) return "This field is required."
		},
		modifier: function (newValue, oldValue) {
			return newValue.replace(
				/(?:^|\s)\S/g,
				function(s) {
					return s.toUpperCase()
				})
		}
	}
})

form.fullName("first last")
form.fullName() // First Last
```

## Cleaner
Cleaner is used for cleaning modified data if necessary.
`.isValid()` applies `cleaner` before validating the fields.
`.data()` also applies `cleaner` to each fields before returning the key-value pairs.

```javascript
var aform = powerform({
  card: {
    validator: function (card) {
      if (!card) return "This field is required."
    },
    modifier: function (newCard, oldCard) {
      if (newCard.length === 16) { // change this for actual form input
				return newCard.split("-").join("").replace(/(\d{4})/g, "$1-").replace(/(.)$/, "");
			}
      return newCard.split("-").join("").replace(/(\d{4})/g, "$1-")
    },
    cleaner: function (card) {
    	return card.split("-").join("")
    }
  }
})

aform.card("1111222233334444")
aform.card() // "1111-2222-3333-4444"
aform.data() // {card: "1111222233334444"}
```
