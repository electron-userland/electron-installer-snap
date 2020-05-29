/**
 * The `electron-installer-snap` API uses the Promise pattern to perform asynchronous operations.
 *
 * Minimal example:
 *
 * ```javascript
 * const snap = require('electron-installer-snap')
 *
 * const snapPath = await snap(options)
 * console.log(`Created snap at ${snapPath}!`)
 * ```
 *
 * Full example with [Electron Packager](https://npm.im/electron-packager):
 *
 * ```javascript
 * const packager = require('electron-packager')
 * const snap = require('electron-installer-snap')
 *
 * const arch = 'x64'
 *
 * const paths = await packager({dir: '/path/to/app', platform: 'linux', arch: arch})
 * const snapPath = await snap({src: paths[0], arch: arch})
 * console.log(`Created snap at ${snapPath}!`)
 * ```
 *
 * If you need to use the callback pattern instead of the `async`/`await` pattern, look into the
 * [`util.callbackify` function](https://nodejs.org/api/util.html#util_util_callbackify_original).
 */
declare function createSnap(userSupplied: createSnap.Options & createSnap.SnapcraftConfig): Promise<string>;

declare namespace createSnap {
  type SnapcraftConfig = Record<string, unknown>;
  /**
   * Any options that aren't specified here are passed through to the `snapcraft.yaml` file.
   */
  interface Options {
    src: string;

    /**
     * [Additional Snapcraft configuration](https://docs.snapcraft.io/build-snaps/syntax#app-name)
     * for the Electron app.
     */
    appConfig?: object;
    /**
     * Additional [plugs](https://docs.snapcraft.io/reference/interfaces) for the Electron app,
     * which are necessary for the app to be a consumer of a feature in the system. Common features
     * can be set via the [[`features`]] option. To set any attributes for the plugs, set them in
     * the [[`plugs`]] option.
     *
     * For example, if the app uses a DBus interface:
     *
     * ```javascript
     * {
     *   appPlugs: ['my-dbus-interface'],
     *   plugs: {
     *     'my-dbus-interface': {
     *       interface: 'dbus',
     *       name: 'com.example.my-interface',
     *       bus: 'session'
     *     }
     *   }
     * }
     * ```
     *
     * `plugs` will be passed through directly to the generated `snapcraft.yaml`.
     */
    appPlugs?: string[];
    /**
     * Additional [slots](https://docs.snapcraft.io/reference/interfaces) for the Electron app,
     * which are necessary for the app to be a producer of a feature in the system. Common features
     * can be set via the [[`features`]] option. To set any attributes for the plugs, set them in
     * the [[`slots`]] option.
     *
     * For example, if the app creates a DBus interface:
     *
     * ```javascript
     * {
     *   appSlots: ['my-dbus-interface'],
     *   slots: {
     *     'my-dbus-interface': {
     *       interface: 'dbus',
     *       name: 'com.example.my-interface',
     *       bus: 'session'
     *     }
     *   }
     * }
     * ```
     *
     * [[`slots`]] will be passed through directly to the generated `snapcraft.yaml`.
     */
    appSlots?: string[];
    /**
     * Either the Node.js-formatted arch or Snap-formatted arch, used to specify the Snap's target arch.
     *
     * Default: the host arch, via [`process.arch`](https://nodejs.org/dist/latest-v12.x/docs/api/process.html#process_process_arch).
     */
    arch?: string;
    /**
     * See the [Snapcraft documentation](https://snapcraft.io/docs/reference/confinement).
     *
     * Default: `devmode`
     */
    confinement?: 'strict' | 'devmode' | 'classic';
    /**
     * The longer description for the snap. Can contain newlines.
     */
    description?: string;
    /**
     * The absolute path to a custom Freedesktop.org desktop file template.
     */
    desktopTemplate?: string;
    /**
     * The directory where the `.snap` file is created.
     *
     * Default: the current working directory.
     */
    dest?: string;
    /**
     * The executable name of the Electron app, sans file extension. Corresponds
     * to the [`executableName` option](https://electron.github.io/electron-packager/master/interfaces/electronpackager.options.html#executablename)
     * in Electron Packager.
     *
     * Default: either `productName` or `name` in `package.json`
     */
    executableName?: string;
    /**
     * Describes what functionality the Electron app needs, in order to work inside the Snap sandbox.
     *
     * Example:
     *
     * ```javascript
     * {
     *   features: {
     *     audio: true,
     *     mpris: 'com.example.mpris',
     *     webgl: true
     *   }
     * }
     * ```
     *
     * Setting a feature to a `false`-y value does not disable the feature, only omitting the
     * feature from the `Object` does that.
     */
    features?: {
      /**
       * Audio support via PulseAudio.
       */
      audio?: true;
      /**
       * Audio support via ALSA (replaces `audio` support if both are specified)
       */
      alsa?: true;
      /**
       * [Web browser functionality](https://github.com/snapcore/snapd/wiki/Interfaces#browser-support).
       * This is enabled by default when using Electron ≥ 5.0.0, due to the
       * [setuid sandbox support](https://github.com/electron/electron/pull/17269).
       */
      browserSandbox?: true;
      /**
       * [MPRIS](https://specifications.freedesktop.org/mpris-spec/latest/) support.
       *
       * If enabled, the interface name must be specified as the feature value.
       */
      mpris?: string;
      /**
       * Access the secret service (e.g., GNOME Keyring)
       */
      passwords?: true;
      /**
       * WebGL support (requires Mesa, etc.)
       */
      webgl?: true;
    };
    /**
     * The quality grade of the Snap. See the [Snapcraft documentation](https://docs.snapcraft.io/build-snaps/syntax#grade)
     * for valid values.
     *
     * Default: `devel`
     */
    grade?: 'devel' | 'stable';
    /**
     * One or more [hook scripts](https://docs.snapcraft.io/build-snaps/hooks) to be installed with
     * the Snap. The format of the `Object` is `{ hookName: pathToHookScript, […] }`. Hook names
     * can be found in the Snapcraft documentation.
     */
    hookScripts?: Record<string, string>;
    /**
     * The name of the Snap package.
     *
     * Default: `name` in `package.json`
     */
    name?: string;
    /**
     * See [[`appPlugs`]] for details.
     */
    plugs?: object;
    /**
     * See [[`appSlots`]] for details.
     */
    slots?: object;
    /**
     * The absolute path to the snapcraft executable.
     *
     * By default, it searches paths in the `PATH` environment variable.
     */
    snapcraft?: string;
    /**
     * A 78 character long summary for the Snap.
     *
     * Default: `description` in `package.json`
     */
    summary?: string;
    /**
     * The version of the Snap package.
     *
     * Default: `version` in `package.json`
     */
    version?: string;
  }
}

export = createSnap;
