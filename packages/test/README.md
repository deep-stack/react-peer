# test

## Setup

* Create a [Browserstack account](https://www.browserstack.com/users/sign_up?ref=automate-hero) and keep your credentials handy

* Create a `.env` file from the `.env.example`:

  ```bash
  cp .env.example .env
  ```

* Update `.env` with your Browserstack credentials and the app URL(s)

* Install dependencies:

  ```bash
  yarn
  ```

## Run tests

* Run Browserstack tests:

  ```bash
  # with test-app
  yarn test

  # with mobymask-app
  yarn test:mobymask
  ```

* Check the [Browserstack dashboard](https://automate.browserstack.com/dashboard/v2) for status of your test
