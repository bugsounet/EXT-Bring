# EXT-Bring

This is a module for the [MagicMirror²](https://github.com/MichMich/MagicMirror/).

*The module is not released by the bring! company*

Displays Your Bring! List in a table view on your mirror.

The refresh interval is 30 Seconds.

You need to create a email/password account on the website to use this module.

Just use the "create magic link" function in the app, use it to login to the website on a laptop or desktop comupter and create a emailadress/passowrd login.

The module was created using the REST api they use on their web site by reverse engineering it.

It is absolutely unsupported by the bring team.

If they change their API it will probably break the module. So use it at your own Risk.

## Install guide

login to your rapberry pi, cd into the modules folder and execute
```
git clone https://github.com/bugsounet/EXT-Bring
cd EXT-Bring
npm install
```

## Using the module

To use this module, add the following configuration block to the modules array in the `config/config.js` file:
```js
  {
    module: 'EXT-Bring',
    position: 'top_right',
    config: {
      // See below for configurable options
    }
  }
```

## Configuration options

| Option           | Description
|----------------- |-----------
| `listName`       | *Required* The name of the List you want to display. Please make sure this matches EXACTLY. The Name is case sensitive. 
| `email`          | *Required* The email adress to log in to your bring account 
| `password`       | *Required* The password to log in to your bring account
| `lang`           | *Required* Your language code number
| `columns`        | *Optional* The number of colums in the table view (default = `4`)
| `maxRows`        | *Optional* The maximum number of rows to display in the table view (default = `4`)
| `updateInterval` | *Optional* The update frequency in milliseconds. (default = `60000` = 1 Minute, cannot be set to less than `30000` = 30 seconds to avoid mistakes)
| `debug`          | *Optional* Writes many more log entries to the console if set to `true` to identify failures (default = `false`)
| `showBackground` | *Optional* Display a Background around item place or not
| `showBox`        | *Optional* Display a Box around items 

### Example configuration:
```js
  {
    module: "EXT-Bring",
    position: "top_right",
    config: {
      debug: false,
      listName: "Liste",
      email: "someone@example.com",
      password: "secret",
      lang: 0,
      columns: 3,
      maxRows: 5,
      updateInterval: 30000,
      showBackground: true,
      showBox: true
    }
  }
```

### `lang` code number

| Number  | Language
|---------|-----------
|  0 | French (default)
|  1 | German from austria
|  2 | Swiss German
|  3 |  German
|  4 | Spanish
|  5 | British english
|  6 | American english
|  7 | Canadian english
|  8 | Australian english
|  9 | French from switzerland
|  10 | French
|  11 | Italian from switzerland
|  12 | Italian
|  13 | portuguese
|  14 | Dutch
|  15 | Hungarian
|  16 | Norwegian
|  17 | Polish
|  18 | Russian
|  19 | Swedish
|  20 | Turkish

## Example Screen:
![Screenshot](Screenshot.JPG)
