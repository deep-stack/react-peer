# react-peer

Monorepo for using [@cerc-io/peer](https://github.com/cerc-io/watcher-ts/tree/main/packages/peer) package in react applications.

## Packages

* [react-peer](packages/react-peer/)

  React component that can be used by react apps to use the `@cerc-io/peer` package.

* [test-app](packages/test-app/)

  React test application (uses `react-peer`) to demonstrate p2p networking.

## Setup

From the root of this repository, run:

`yarn && yarn build`

to download dependencies and build all the packages.
