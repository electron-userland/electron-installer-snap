# `electron-installer-snap` API Documentation

## Usage

The `electron-installer-snap` API uses the Promise pattern to perform asynchronous operations.

Minimal example:

```javascript
const snap = require('electron-installer-snap')

snap(options)
  .then(snapPath => console.log(`Created snap at ${snapPath}!`))
```

Full example with [Electron Packager](https://npm.im/electron-packager):

```javascript
const packager = require('electron-packager')
const snap = require('electron-installer-snap')

const arch = 'x64'

packager({dir: '/path/to/app', platform: 'linux', arch: arch})
  .then(paths => snap({src: paths[0], arch: arch}))
  .then(snapPath => console.log(`Created snap at ${snapPath}!`))
```

If you need to use the callback pattern instead of the Promise pattern, look into the [`nodeify` module](https://npm.im/nodeify).

## `options`

Any options that aren't specified here are passed through to the `snapcraft.yaml` file.

### Required

#### `src`

*String*

The directory where the customized Electron application has been created, e.g., via Electron
Packager.

### Optional

#### `appConfig`

*Object* (Default: `{}`)

[Additional Snapcraft configuration](https://docs.snapcraft.io/build-snaps/syntax#app-name) for the
Electron app.

#### `appPlugs`

*Array* of *String*s

Additional [plugs](https://docs.snapcraft.io/reference/interfaces) for the Electron app which are
necessary for the app to be a consumer of a feature in the system. Common features can be set via
the [`features`](#features) option. To set any attributes for the plugs, set them in the
`plugs` option.

For example, if the app uses a DBus interface:

```javascript
{
  appPlugs: ['my-dbus-interface'],
  plugs: {
    'my-dbus-interface': {
      interface: 'dbus',
      name: 'com.example.my-interface',
      bus: 'session'
    }
  }
}
```

`plugs` will be passed through directly to the generated `snapcraft.yaml`.

#### `appSlots`

*Array* of *String*s

Additional [slots](https://docs.snapcraft.io/reference/interfaces) for the Electron app which are
necessary for the app to be a producer of a feature in the system. Common features can be set via
the [`features`](#features) option. To set any attributes for the plugs, set them in the
`slots` option.

For example, if the app creates a DBus interface:

```javascript
{
  appSlots: ['my-dbus-interface'],
  slots: {
    'my-dbus-interface': {
      interface: 'dbus',
      name: 'com.example.my-interface',
      bus: 'session'
    }
  }
}
```

`slots` will be passed through directly to the generated `snapcraft.yaml`.

#### `arch`

*String* (Default: host arch, via `process.arch`)

Either the Node.js-formatted arch or Snap-formatted arch, used to specify the Snap's target arch.

#### `confinement`

*String*

See the [Snapcraft documentation](https://snapcraft.io/docs/reference/confinement).

#### `description`

*String*

The longer description for the snap. Can contain newlines.

#### `desktopTemplate`

*String*

The absolute path to a custom Freedesktop.org desktop file template.

#### `dest`

*String* (Default: current working directory)

The directory where the `.snap` file is created. Defaults to the current working directory.

#### `executableName`

*String* (Default: either `productName` or `name` in `package.json`)

The executable name of the Electron app, sans file extension. Corresponds to the [`executableName`
option](https://github.com/electron-userland/electron-packager/blob/master/docs/api#executablename)
in Electron Packager.

#### `features`

*Object*

Describes what functionality the Electron app needs, in order to work inside the Snap sandbox.
Available features:

* `audio` - PulseAudio support
* `alsa` - ALSA support *(replaces `audio` support if both are specified)*
* `browserSandbox` - [web browser functionality](https://github.com/snapcore/snapd/wiki/Interfaces#browser-support)
  (e.g., Brave)
* `mpris` - [MPRIS](https://specifications.freedesktop.org/mpris-spec/latest/) support. If enabled,
  the interface name must be specified as the feature value.
* `passwords` - Access the secret service (e.g., GNOME Keyring)
* `webgl` - WebGL support (requires Mesa, etc.)

Example:

```javascript
{
  features: {
    audio: true,
    mpris: 'com.example.mpris',
    webgl: true
  }
}
```

Setting a feature to a `false`-y value does not disable the feature, only omitting the feature from the
`Object` does that.

#### `grade`

*String*

The quality grade of the Snap. See the [Snapcraft documentation](https://docs.snapcraft.io/build-snaps/syntax#grade)
for valid values.

#### `hookScripts`

*Object*

One or more [hook scripts](https://docs.snapcraft.io/build-snaps/hooks) to be installed with the
Snap. The format of the `Object` is `{ hookName: pathToHookScript, [...] }`. Hook names can be found
in the Snapcraft documentation.

#### `name`

*String* (Default: `name` in `package.json`)

The name of the Snap package.

#### `snapcraft`

*String* (Default: searches paths in the `PATH` environment variable)

The absolute path to the `snapcraft` executable.

#### `summary`

*String* (Default: `description` in `package.json`)

A 78 character long summary for the Snap.

#### `version`

*String* (Default: `version` in `package.json`)

The version of the Snap package.
