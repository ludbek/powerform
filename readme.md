[![Build Status](https://travis-ci.org/ludbek/powerform.svg?branch=master)](https://travis-ci.org/ludbek/powerform)

<img src="https://user-images.githubusercontent.com/8296449/30893678-3e1702a8-a35f-11e7-8f6c-965ffe88cf40.png" width=400>

Logo by [Anand](https://www.behance.net/mukhiyaanad378)

# Introduction
A tiny form model which can be used in apps with or without frameworks like [Mithril](https://github.com/MithrilJS/mithril.js/), [React](https://github.com/facebook/react), etc.

## Features
- Each field can have multiple validators
- Allows to toggle between single and multiple errors
- Per field validation
- Decorate data, imagine inserting dashes while filling credit card
- Reset form or single field
- Check if fields have been modified
- debounce projection

# Updates
- v2.3.0
  - bulk assign
  - data change projector
- v2.2.0 [breaking changes]

  - validatex@0.3.x
  
    - it requires validators to return error message instead of throwing them
    - it requires validators to throw SkipValidation to short curcuit the validation
    - [visit validatex for more detail](https://github.com/ludbek/validatex#updates)

# Installation
## npm
`npm install powerform`
## Bower
`bower install validatex`

`bower install powerform`

# Requirement
`powerform` internally uses [`validatex`](https://github.com/ludbek/validatex) for validation.

# Compatibility
`powerform` works with all the modern browsers. For old ones please use shim like [this](https://github.com/es-shims/es5-shim).

# Quick walk-through
```javascript
// es6
> import powerform from "powerform"

// node
var powerform = require("powerform");

// browser
// Include validatex.min.js at script tag. (from package validatex)
// Include /dist/powerform.min.js at script tag.

// create form
var form = powerform({
  username: function (value) {
    if(!value) {
      return "This field is required"
    }
  },
  password: function (value) {
    if(value.length < 8) {
      return "This field must be at least 8 characters long."
    }
  },
  confirmPassword: function (value, dform) {
    if (value !== dform.password) {
      return "Password and confirmation does not match."
    }
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
    if (!value) {
      return "This field is required."
    }
  }
})
```
## Set default value
```javascript
var form = powerform({
  name: {
    default: "aname",
    validator: function (value) {
      if(!value) {
        return "This field is required.")
      }
    }
  }
})

form.name() // "aname"
```

## Set multiple validators
Powerform now allows multiple validators per field.

```javascript
import {required, minLength} from "validatex";

var form = powerform({
  username: [required(true), minLength(6)]
}, true);


form.isValid()
=> false

form.error()
=>
// {
//   username: "This field is required"
// }

```


## Get multiple errors
By default `powerform` returns single error per field.
Pass `true` as the 2nd argument to `powerform` for getting multiple errors.

```javascript
import {required, minLength} from "validatex";

var form = powerform({
  username: [required(true), minLength(6)]
}, true);


form.isValid()
=> false

form.error()
=>
// {
//   username:
//     [
//       "This field is required.",
//       "It must be at least 6 characters long."
//     ]
// }
```

## Project changes
Sometime it is desirable to project changes in form to external world, such a store.

### Field specific projector
Each field takes a key `projector` which will be called everytime the field value changes.

```javascript
var store;
var projector = (fieldValue, allValue) => {
  store = fieldValue;
}

var aform = powerform({
  username: {
    validator: required(true),
    projector: projector
  },
  password: required(true)
});


aform.password("apassword");
console.log(store);
=> undefined

aform.username("ausername");
console.log(store);
=> "ausername"
```

### Global projector
Powerform take 3rd argument called `projector` which will be called everytime form data changes.

```javascript
var store;

var projector = (data) => {
  store = data;
};

var aform = powerform({username: required(true)}, false, projector);
aform.username("aname");

expect(store).to.eql({username: "aname"});
```

## Debounce projection
Projection of changes in a field can be debounced by supplying `debounce` option.

```javascript
let search = (value) => {
  // hit search api 
}
let aform = powerform({username: required(true), projector: search, debounce: 1000});
aform.username("god"); // this change will be projected after 1 second.
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
Sets/gets the key-value pairs of fields and their respective values.

```javascript
let init = {
  task: "Meow meow !!!",
  resolved: true
};

let aform = powerform({
  task: required(true),
  resolved: required(true)
});

aform.data(init);

aform.data(); // {task: "Meow meow !!!", resolved: true}
```

If the second argument to '.data' is true, the data is set as the initial value.

```javascript
let init = {
  task: "Meow meow !!!",
  resolved: true
};

let aform = powerform({
  task: required(true),
  resolved: required(true)
});

aform.data(init);
aform.isDirty() // true

aform.data(init, true);
aform.isDirty() // false, since form's current data and initial data are same
```

### .setInitialValue()
Sets given key-value pairs as the initial value.
Useful in the situation where one has to update the form and set the changes as initial value.

```javascript
let aform = powerform({
  username: {default: "ausername", validator: required(true)},
  password: {default: "apassword", required(true)}
});

let updates = {
  username: "busername",
  password: "bpassword"
};

aform.data(updates);
aform.isDirty(); // true

aform.setInitialValue(updates);
aform.isDirty(); // false
```

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

### .setInitialValue()
Sets the given value as the field's initial.

```javascript
let form = powerform({
  name: required(true)
});

form.name("aname");
form.name.isDirty(); // true

form.name.setInitialValue("aname");
form.name.isDirty(); // false
```

## Modifier
Use `modifier` to decorate input data. It comes handy in situations like capitaling user's name,
inserting `-`(dash) inbetween credit card input, etc.

```javascript
var form = powerform({
	fullName: {
		validator: function (value) {
      if(!value) {
        return "This field is required.")
      }
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
      if (!card) {
        return "This field is required.")
      }
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

# Examples
## [Using with Mithril](https://flems.io/#0=N4Igxg9gdgzhA2BTEAucD4EMAONEBMQAaEAMwEskZUBtUKTAW2TQDoALAF0fmPSk6IBqECAC+RekxYhWAK2olIAoZxHKYnAATAtAJ0QBHAK7kD+IlqPHM8GABUIWsVoC8WgG63y+TIIAeANwAOlBa4RGhGtoAgtjYbjqh4dDkUOScKFqkxlBgnOTQABQeUBD4iACUSWERpeWIrJp+iInAyRHhpBB6jFnYEADuiHrdvUXttZ3hxnh6DMxZk9PTFaSYxvCZWsEgu0QdK+Fe8D5+PVk0h0fhBiZmBEWcesZV1ysAuu8REt-h2JgYDBBj18Es-hE1hstlldvsIcdvL5OBd9NYHvgni83lNpr9cZ1lBRegAFQHA0HggmrRDrTbbOHEBGeJHnPSXZm3dHmLGvSoHakray2BwQIq7AFAkF6fC7SrMr6C5zfMT874wYwAI0YGSyOTyBWgWiK1WWR3qFSanBaTS1Os4ADFMJQCIl1nZEIEtAB6b1ovCcCHkUjGgCEFsazUErDGjFY5BgADUkSbTcyI1abRrtRknS78Ilnq8QkquZxjPNsiLPRCxBDfVoAMojDwjLQwHytE5nQ1Qet+5tQAuxrTIzBaFFaGIkgCSrHnWk1xm0aU0iEwBeGWkGlHgWjks20MHYQy0szbpEQBE1mDAAGsIRmo5G7RlBAX3EWa0qn9bo9n7TzJAPyrD0SxuAxy0rd08HAvEBRWADc2dYC9WrBDpiQzh3zQj1rjrWp8WOchEEGPVcnyQowhKMoKjTXFonbP9WncX8Wjg8JGJHdxnxjHpGA4rRGJGPQehgN1+NYESehNQTGKwoDXR45jbRzR0UIIOToE0bJ+IAUT0US9HE5SbVjAyjJgQTIIrMJeKw99vgAfi0RhxRAdgAGZ9h2EAAE0IGMAByAxR2gRBQzlb4sjc3ZY3hJVdG019tnslLnAwlYrlLVz3PYABGHzdkbcgAHMwmMbA5Uyo5YtkUTBh87Kbk6Oq0mwZcfLNFqIgWRBYRAc95mkBKes6bAsDARAT3gCp2V8gBVOY+tGsaUnSKAOu2OMd04dgYmwvR3JOV4fNjVghr6tUcs6aAwHYTAoFK-rdN6C7lukeMkyRTlnGutaFI0gsADJga0UNzsuz6E2TU5MWqUHcolKTDJ6M7JKh5gUaM1Mas+f6Wrq1gGqa362s2zriBqNbwj6gbJQpGVVrWibb2mhA5oGskpVBZmxtSCnttYXb9sO47bFOqnzoZ6V8AJta7oep6Xul8lZa+2GfF+1U8aOQH8y0RGIckmXQQ1lMEbBursGxtGpZNtWzeko7Knlo4PjdlYiZJqnmrG8mtq637aekAaiTMRhucZ2UmRuiJWammbOd8gBhaBiUYLRTaZ2Oaa0AWtpi4WMlF55xfgSXLHO8PSUdmVPZaxXHuevVJJryO6-wc24e1hvEJSxSQbB423vbqP1Zhi3Dat9ybed9HR-TiPx6d1GXb7iIPd11r3OJoZSbjuql2w6Ag7j9awFOe8sjStTtcsYqhBj+Uco9iFFRWSo4IIgjQjjRhAoCCKPgCAYBjDMAEKwTU5QACelg4jYC-qEcQkgQB9REKwMAQI+DKEEMINA0D8AwOprpAQABadYOp4AwJvo9GAZC5jBhLARPegwtAAGotCsJIYwTAehSppDISibAWR8oGAEqEAic8148L4QIqAWRWAAFZxFaAAAzqPUXBSA8BUTmGYeID4JBThQDvNQFAdA0HSBEPadgehKB8ArLwNAXBOC4BQL6XI2A7ylUwRARg3pbH2PgAAAXyqwcJSjAkl2CfIRQIBOAwOwDIBQKCpDMBEN2ZEiB-CsB1FAOJji9DOI8thdxnjNo+L8QErJLR-AhLUawTyETvT4ATJwb0tSAh5LSIUkgiTkkiFSRIdJMgBjDFGJJfJfTBrFJEK48p3ovFVMgAE8ZIxYwhIAEysAABysDUa09p3p1mTLetM1J-SkkpOoGID4YggA) - by [ArthurClemens](https://github.com/ArthurClemens)
