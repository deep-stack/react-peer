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
    ```bash
    yarn test
    ```
* Visit [Browserstack dashboard](https://automate.browserstack.com/dashboard/v2) to check the status of your test. 
* Test launches multiple browser instances on Browserstack. These instances attempt to connect to [peer-test-app](https://peer-test-app.dev.vdb.to/). When the peer is connected to a relay, it waits for connections with other peers. The test starts once enough connections are established.
