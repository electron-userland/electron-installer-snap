# Electron Installer: Snap - Changes by Version

## [Unreleased]

[Unreleased]: https://github.com/electron-userland/electron-installer-snap/compare/v5.0.0...master

## [5.0.0] - 2020-01-21

[5.0.0]: https://github.com/electron-userland/electron-installer-snap/compare/v4.1.0...v5.0.0

### Changed

* Reduce the number of dependencies (#60, #65)

### Removed

* Node &lt; 10 support (#62)

## [4.1.0] - 2019-11-21

[4.1.0]: https://github.com/electron-userland/electron-installer-snap/compare/v4.0.0...v4.1.0

### Added

* Autodetect the base option when it's not specified by the user (#47)

## [4.0.0] - 2019-06-20

[4.0.0]: https://github.com/electron-userland/electron-installer-snap/compare/v3.2.0...v4.0.0

### Fixed

* Depend on `pulseaudio`, not `libpulse0`, when using the `pulseaudio` feature (#35)

### Removed

* Callback-style support (use `async` / `await` syntax or `util.callbackify`) (#28)
* Node &lt; 8 support (#28)

## [3.2.0] - 2019-05-03

[3.2.0]: https://github.com/electron-userland/electron-installer-snap/compare/v3.1.1...v3.2.0

### Added

* Always set the browser sandbox feature for Electron >= 5.0.0 (#22)

## [3.1.1] - 2019-02-21

[3.1.1]: https://github.com/electron-userland/electron-installer-snap/compare/v3.1.0...v3.1.1

### Changed

* Upgrade to `electron-installer-common@^0.6.1`

## [3.1.0] - 2019-01-06

[3.1.0]: https://github.com/electron-userland/electron-installer-snap/compare/v3.0.1...v3.1.0

### Added

* Normalize and validate the Snap name (#13)

## [3.0.1] - 2018-12-26

[3.0.1]: https://github.com/electron-userland/electron-installer-snap/compare/v3.0.0...v3.0.1

### Fixed

* Electron 4 support (#8)

## [3.0.0] - 2018-07-16

[3.0.0]: https://github.com/electron-userland/electron-installer-snap/compare/v2.0.1...v3.0.0

### Changed

* Minimum Node version increased to Node 6, as Node 4 is no longer LTS (#6)

## [2.0.1] - 2018-02-22

[2.0.1]: https://github.com/electron-userland/electron-installer-snap/compare/v2.0.0...v2.0.1

### Fixed

* Support for Electron 2.x (GTK3) (#4)

## [2.0.0] - 2018-01-31

[2.0.0]: https://github.com/electron-userland/electron-installer-snap/releases/tag/v2.0.0

Initial release.
