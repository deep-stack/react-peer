# test

## Setup

* Create a [Browserstack account](https://www.browserstack.com/users/sign_up?ref=automate-hero) and keep your credentials handy

* Create a `.env` file from the `.env.example`:

  ```bash
  cp .env.example .env
  ```

* Update `.env` with your Browserstack credentials and the app URL

* Install dependencies:

  ```bash
  yarn
  ```

## Run tests

* Run Browserstack tests:

  ```bash
  yarn test
  ```

* Check the [Browserstack dashboard](https://automate.browserstack.com/dashboard/v2) for status of your test

* The current test launches multiple browser instances on Browserstack. These instances attempt to connect to the [peer-test-app](https://peer-test-app.dev.vdb.to/). When a peer is connected to a relay, it waits for connections with other peers. The test starts once enough connections are established.
