# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 14/12/2020

### Added

- Add query response to error object before rejecting the promise. If the query itself doesn't fail but the responseValidator returns false, the whole response can be accessed via `error.response`.
- Add CHANGELOG.md.

### Changed

- Fixed some mistakes on README.md.

## [1.0.0 - 11/12/2020

### Added

- A new JavaScript library.

### Changed

- The world.
