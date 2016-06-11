# Introduction
A form model for [Mithril.js](https://github.com/lhorie/mithril.js/). Used to be part of [mithril-ui](https://github.com/ludbek/mithril-ui).

# Installation
## npm
`npm install mithril-form`
## Bower
`bower install mithril-form`

# Validation
`mithril-form` uses [validate.js](https://validatejs.org/) for validation.

# Quick walk-through
```javascript
> import Form from "mithril-form"

// create form
> let form = new Form({
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
let form = new Form({name: {presence: true}})
```
## Set default value
```javascript
let form = new Form({name: {presence: true, default: "aname"}})
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


# Using it with Mithril.js
```javascript
let signup = {
  controller: function () {
    return {
      form: new Form({
        username: {presence: true},
        password: {presence: true},
        confirmPassword: {presence: true, equality: "password"}}),
      submit: function () {
        if(!this.form.isValid()) return
        SignupAPI(this.form.data())
          .then((res) => {
            m.route("/login/")})
          ["catch"]((errors) => {
            this.form.errors(errors)})
          .then(()=> m.redraw())}
    }
  },
  view: function (ctrl) {
    return m("form",
      m("input", {
        placeholder: "Username",
        onkeypress: m.withAttr("value", ctrl.form.username),
        onchange: ctrl.form.username.isValid}),
      _.map(ctrl.form.username.errors(), (error) => {
        return m("p.error", error)}),
      m("input", {
        placeholder: "Password",
        onkeypress: m.withAttr("value", ctrl.form.password),
        onchange: ctrl.form.password.isValid}),
      _.map(ctrl.form.password.errors(), (error) => {
        return m("p.error", error)}),
      m("input", {
        placeholder: "Confirm Password",
        onkeypress: m.withAttr("value", ctrl.form.confirmPassword),
        onchange: ctrl.form.confirmPassword.isValid}),
      _.map(ctrl.form.confirmPassword.errors(), (error) => {
        return m("p.error", error)}),
      m("button", {
        disabled: !ctrl.form.isValid(false),
        onclick: ctrl.submit.bind(ctrl)}, "Submit"))
  }
}
```

