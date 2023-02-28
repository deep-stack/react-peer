# peer-test-automation

## Setup 

* Create a [Browserstack account](https://www.browserstack.com/users/sign_up?ref=automate-hero) and keep your credentials handy
* Create a `.env` file from the `.env.example` 
    ```bash
    cp .env.example .env
    ```
* Update `.env` with your Browserstack username and access key
* Install dependencies
    ```bash
    yarn
    ```

## Run tests

* Run Browserstack test using yarn
    ```
    yarn test
    ```
* Check [Browserstack dashboard](https://automate.browserstack.com/dashboard/v2). Your browser instances should show up there. 
* Test launches multiple browser instances on Browserstack. These instances attempt to connect to [peer-test-app](https://peer-test-app.dev.vdb.to/). Once the peer is connected, it prints it's `peerId` to the console and waits for connections. Once enough connections are established, it starts testing and prints any updates to the console.
