# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Instructions

* Install dependencies:

  ```bash
  # In repo root
  yarn install
  ```

* Set the relay node multiaddrs in the [config](./src/config.json) file:

  ```
  {
    "relayNodes": [
      "/dns4/relay1.example.com/tcp/443/https/p2p-webrtc-direct/p2p/12D3KooWJhmR6LTn9rpiJjDkvWf4LbsoWe3iMVm53JFzGUBUAECt",
      "/dns4/relay2.example.com/tcp/443/https/p2p-webrtc-direct/p2p/12D3KooWJLXEX2GfHPSZR3z9QKNSN8EY6pXo7FZ9XtFhiKLJATtC"
    ]
  }
  ```

* Start the react app in development mode:

  ```bash
  # In packages/test-app
  yarn start
  ```

* The app can be opened in multiple browsers

## Development

* Build the `@cerc-io/peer` package after making changes:

  ```bash
  # In watcher-ts/packages/peer
  yarn build
  ```

* Register package for yarn link:

  ```bash
  # In watcher-ts/packages/peer
  yarn link
  ```

- Yarn link the `@cerc-io/peer` package:

  ```bash
  # In repo root
  yarn link "@cerc-io/peer"
  ```

* (Optional) Create and export a peer id for the relay node:

  ```bash
  # In watcher-ts/packages/peer
  yarn create-peer --file [PEER_ID_FILE_PATH]
  ```

  * `file (f)`: file path to export the peer id to (json) (default: logs to console)

* (Optional) Run a local relay node:

  ```bash
  # In watcher-ts/packages/peer
  yarn relay-node --port [LISTEN_PORT] --peer-id-file [PEER_ID_FILE_PATH] --relay-peers [RELAY_PEERS_FILE_PATH]
  ```

  * `port`: Port to start listening on (default: `9090`)
  * `peer-id-file`: file path for peer id to be used (json)
  * `relay-peers`: file path for relay peer multiaddr(s) to dial on startup (json)

* Follow [instructions](#instructions) to start the app

* The react app server running in development mode should recompile after building the `@cerc-io/peer` package

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
