const webdriver = require('selenium-webdriver');

const {
    CHECK_CONNECTION_INTERVAL,
    MIN_REQUIRED_CONNECTIONS,
    WAIT_BEFORE_RETRY,
    TEST_RETRIES,
    TEST_INTERVAL,
    TOTAL_PEERS,
} = require('./constants');

const sleep = sec => new Promise(r => setTimeout(r, sec * 1000));

class ConnectionDropped extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}

async function getConnections(connectionElement){
    var connections = await connectionElement.getText().then(function (conns){return conns;} );
    return parseInt(connections);
}

// Periodically tracks number of connections to check if they drop below the desired number
async function trackPeerConnections (element, flags) {
    // Run until test is either successful or aborted
    while (!(flags.testSuccessful || flags.abortTest)) {
        try {
            let connections = await getConnections(element);
            if (connections < MIN_REQUIRED_CONNECTIONS) {
                throw ConnectionDropped("Number of connections less than minimum required for testing.");
            } else {
                await sleep(CHECK_CONNECTION_INTERVAL);
            }
        } catch (e) {
            if (e instanceof ConnectionDropped) {
                if(flags.isRetry) {
                    console.log("Connections still under minimum required, aborting execution.");
                    flags.abortTest = True;
                }
                else {
                    flags.isRetry = true;

                    console.log(e.message);
                    console.log("Retrying after a few seconds.");
                    await sleep(WAIT_BEFORE_RETRY);
                }
            } else {
                console.log("Unexpected error at trackPeerConnections : ", e)
                flags.abortTest = true;
            }
        }
    }
}

// Periodically sends and listens for flood messages
async function floodTest(driver, peerId, flags) {
    const floodFrom = new Map();
    checkMsg = 'Hello from';
    floodCmd = `flood("${checkMsg} : ${peerId}")`;

    try {
        var tryCount = 1;

        // Repeat for specified number of times as long as test is neither successful nor aborted
        while (tryCount < TEST_RETRIES && !(flags.testSuccessful || flags.abortTest)) {
            await driver.executeScript(floodCmd);
            await sleep(TEST_INTERVAL);

            var logEntries = await driver.manage().logs().get(webdriver.logging.Type.BROWSER).then(function (entries) {
                var logEntries = [];
                entries.forEach(function(entry){
                    var ok = ''+ entry.message;
                    if(ok.includes(checkMsg)){
                        logEntries = logEntries.concat([ok.split(checkMsg)[1]]);
                    }
                });
                return logEntries;
            });

            logEntries.forEach(async function (entry) {
                let exists  = floodFrom.get(entry);
                if(exists){
                    floodFrom.set(entry, exists+1);
                } else {
                    floodFrom.set(entry,1);
                }
            });

            if(floodFrom.size === TOTAL_PEERS) {
                flags.testSuccessful = true;
                return;
            }

            tryCount++;
        }

        if(!flags.testSuccessful){
            driver.executeScript('browserstack_executor: {"action": "setSessionStatus", "arguments": {"status":"failed", "Flood test failed : Did not get flood messages back"');
        }
    } catch (e) {
      console.log(e);
    }
}

module.exports = { trackPeerConnections, floodTest };
