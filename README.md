# react-peer

[![Travis][build-badge]][build]
[![npm package][npm-badge]][npm]
[![Coveralls][coveralls-badge]][coveralls]

React component for using [@cerc-io/peer](https://github.com/cerc-io/watcher-ts/tree/main/packages/peer) package.

[build-badge]: https://img.shields.io/travis/user/repo/master.png?style=flat-square
[build]: https://travis-ci.org/user/repo

[npm-badge]: https://img.shields.io/npm/v/npm-package.png?style=flat-square
[npm]: https://www.npmjs.org/package/npm-package

[coveralls-badge]: https://img.shields.io/coveralls/user/repo/master.png?style=flat-square
[coveralls]: https://coveralls.io/github/user/repo

## Development

To use react-peer package in react applications during development:

- Build package

  ```bash
  yarn && yarn build
  ```

- Register package for yarn link

  ```bash
  yarn link
  ```

- Register react library for yarn link to avoid dupplicate react library issues

  ```bash
  cd node_modules/react

  yarn link
  ```

- Yarn link packages in the react application where we want to use react-peer

  ```bash
  # In react application repo directory
  yarn link "react"

  yarn link "@cerc-io/react-peer"
  ```

- Import react-peer to use

  ```js
  import { PeerProvider, PeerContext } from '@cerc-io/react-peer'
  ```
