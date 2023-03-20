# test

## Setup

* Install dependencies:

  ```bash
  yarn
  ```

* Create a `.env` file from the `.env.example`:

  ```bash
  cp .env.example .env
  ```

### For BrowserStack

* Create a [Browserstack account](https://www.browserstack.com/users/sign_up?ref=automate-hero) and keep your credentials handy

* Update `.env` with your Browserstack credentials and the app URL(s)

* In `.env`, set `USE_BSTACK_GRID = true`

### For selenium grid
      
* Start selenium hub and node-docker containers

    ```bash
    docker-compose up -d
    ```
    
* Check docker logs to confirm that node was added.

    ```bash
    docker-compose logs -f
    ```
    Sample log of a node successfully added to the hub:
    ```
    selenium-hub        | 12:06:10.854 INFO [GridModel.setAvailability] - Switching Node 2556e552-8e07-47dc-8b87-6c0ce391d059 (uri: http://192.168.96.3:5555) from DOWN to UP
    selenium-hub        | 12:06:10.855 INFO [LocalDistributor.add] - Added node 2556e552-8e07-47dc-8b87-6c0ce391d059 at http://192.168.96.3:5555. Health check every 120s
    .
    .
    test-node-docker-1  | 12:06:10.859 INFO [NodeServer.lambda$createHandlers$2] - Node has been added

    ```

*  Check [selenium's dashboard](http://localhost:4444/ui) if docker node is up and running 

* Update `.env` with grid URL (`http://localhost:4444`)

* Ensure `USE_BSTACK_GRID` is set to `false`

## Run tests

* Run Browserstack tests:

  ```bash
  # with test-app
  yarn test

  # with mobymask-app
  yarn test:mobymask
  ```

* Check the [Browserstack dashboard](https://automate.browserstack.com/dashboard/v2) for status of your test
