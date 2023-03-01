import webdriver from 'selenium-webdriver';

import {
  CHECK_CONNECTION_INTERVAL,
  MIN_REQUIRED_CONNECTIONS,
  WAIT_BEFORE_RETRY,
  TEST_RETRIES,
  TEST_INTERVAL,
  TOTAL_PEERS
} from './constants';

const sleep = (sec: number) => new Promise((resolve) => setTimeout(resolve, sec * 1000));

class ConnectionDropped extends Error {}

async function getConnections (connectionElement: any) {
  const connections = await connectionElement.getText().then((conns: any) => conns);
  return parseInt(connections);
}

// Periodically tracks number of connections to check if they drop below the desired number
export async function trackPeerConnections (element: any, flags: any): Promise<void> {
  // Run until test is either successful or aborted
  while (!(flags.testSuccessful || flags.abortTest)) {
    try {
      const connections = await getConnections(element);
      if (connections < MIN_REQUIRED_CONNECTIONS) {
        throw new ConnectionDropped('Number of connections less than minimum required for testing.');
      } else {
        await sleep(CHECK_CONNECTION_INTERVAL);
      }
    } catch (err) {
      if (err instanceof ConnectionDropped) {
        if (flags.isRetry) {
          console.log('Connections still under minimum required, aborting execution.');
          flags.abortTest = true;
        } else {
          flags.isRetry = true;

          console.log(err.message);
          console.log('Retrying after a few seconds.');
          await sleep(WAIT_BEFORE_RETRY);
        }
      } else {
        console.log('Unexpected error at trackPeerConnections : ', err);
        flags.abortTest = true;
      }
    }
  }
}

// Periodically sends and listens for flood messages
export async function floodTest (driver: webdriver.ThenableWebDriver, peerId: any, flags: any) {
  const floodFrom = new Map();
  const checkMsg = 'Hello from';
  const floodCmd = `flood("${checkMsg} : ${peerId}")`;

  try {
    let tryCount = 1;

    // Repeat for specified number of times as long as test is neither successful nor aborted
    while (tryCount < TEST_RETRIES && !(flags.testSuccessful || flags.abortTest)) {
      await driver.executeScript(floodCmd);
      await sleep(TEST_INTERVAL);

      const logEntries = await driver.manage().logs().get(webdriver.logging.Type.BROWSER).then(function (entries: any) {
        let logEntries: any = [];
        entries.forEach(function (entry: any) {
          const ok = '' + entry.message;
          if (ok.includes(checkMsg)) {
            logEntries = logEntries.concat([ok.split(checkMsg)[1]]);
          }
        });
        return logEntries;
      });

      logEntries.forEach(async function (entry: any) {
        const exists = floodFrom.get(entry);
        if (exists) {
          floodFrom.set(entry, exists + 1);
        } else {
          floodFrom.set(entry, 1);
        }
      });

      if (floodFrom.size === TOTAL_PEERS) {
        flags.testSuccessful = true;
        return;
      }

      tryCount++;
    }

    if (!flags.testSuccessful) {
      driver.executeScript('browserstack_executor: {"action": "setSessionStatus", "arguments": {"status":"failed", "Flood test failed : Did not get flood messages back"');
    }
  } catch (err) {
    console.log(err);
  }
}
