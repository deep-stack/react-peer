# peer-test-automation

### Setup :
* Create a [Browserstack account](https://www.browserstack.com/users/sign_up?ref=automate-hero) and keep your credentials handy
* Create a `.env` file from the `.env.example` and update your Browserstack credentials in it.
* Install the dependencies by running  `yarn`
* You should be able to run the tests by :
    ```
    yarn test
    ```

* Check your Browserstack dashboard and your instances should show up there.


### General info :
Test launches multiple browser instances on Browserstack.  
These instances attempt to connect to [peer-test-app](https://peer-test-app.dev.vdb.to/).  
Once the peer starts, it prints it's `peerId` to the console and waits for connections.  
Once enough connections are established, it starts testing prints any updates to the console.