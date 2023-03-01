import webdriver from 'selenium-webdriver';

import {
  CHECK_CONNECTION_INTERVAL,
  MIN_REQUIRED_CONNECTIONS,
  WAIT_BEFORE_RETRY,
  TEST_RETRIES,
  FLOOD_LOG_CHECK_INTERVAL,
  TOTAL_PEERS
} from './constants';

const sleep = (sec: number) => new Promise((resolve) => setTimeout(resolve, sec * 1000));

export interface TestState {
  isRetry: boolean;
  successful: boolean;
  aborted: boolean;
}

class ConnectionDropped extends Error {}

// Periodically tracks number of connections to check if they drop below the desired number
export async function trackPeerConnections (element: webdriver.WebElement, testState: TestState): Promise<void> {
  // Run until test is either successful or aborted
  while (!(testState.successful || testState.aborted)) {
    try {
      const connectionCount = await getConnections(element);
      if (connectionCount < MIN_REQUIRED_CONNECTIONS) {
        throw new ConnectionDropped('Number of connections less than minimum required for testing');
      }

      await sleep(CHECK_CONNECTION_INTERVAL);
    } catch (err) {
      if (err instanceof ConnectionDropped) {
        await _handleDroppedConnection(testState, err.message);
      } else {
        console.log('Unexpected error: ', err);
        testState.aborted = true;
      }
    }
  }
}

// Periodically sends and listens for flood messages
export async function floodTest (driver: webdriver.ThenableWebDriver, peerId: string, testState: TestState) {
  const floodFrom: Map<string, boolean> = new Map();
  const prefix = 'Hello from';
  const floodCmd = `flood("${prefix} ${peerId}")`;

  try {
    let tryCount = 1;

    // Repeat for specified number of times as long as test is neither successful nor aborted
    while (tryCount < TEST_RETRIES && !(testState.successful || testState.aborted)) {
      await driver.executeScript(floodCmd);
      await sleep(FLOOD_LOG_CHECK_INTERVAL);

      const logEntries = await driver.manage().logs().get(webdriver.logging.Type.BROWSER);

      logEntries.forEach(logEntry => {
        const log = logEntry.message;
        if (log.includes(prefix)) {
          const peerId = log.split(prefix)[1];
          floodFrom.set(peerId, true);
        }
      });

      if (floodFrom.size === TOTAL_PEERS) {
        testState.successful = true;
      }

      tryCount++;
    }

    if (!testState.successful) {
      driver.executeScript('browserstack_executor: {"action": "setSessionStatus", "arguments": {"status":"failed", "Flood test failed : Did not get all flood messages"');
    }
  } catch (err) {
    console.log(err);
  }
}

export async function getConnections (connectionElement: webdriver.WebElement): Promise<number> {
  const connectionCountString = await connectionElement.getText();
  return parseInt(connectionCountString);
}

async function _handleDroppedConnection (testState: TestState, errMessage: string) {
  if (testState.isRetry) {
    console.log('Connections still under minimum required, aborting execution.');
    testState.aborted = true;
  } else {
    testState.isRetry = true;

    console.log(errMessage);
    console.log('Retrying after a few seconds.');
    await sleep(WAIT_BEFORE_RETRY);
  }
}
