import webdriver, { ThenableWebDriver, WebDriver, logging } from 'selenium-webdriver';
import debug from 'debug';

import {
  NODE_START_TIMEOUT,
  NODE_PEER_CONN_TIMEOUT,
  NODE_START_CHECK_INTERVAL,
  NODE_PEER_CONN_CHECK_INTERVAL,
  TOTAL_PEERS
} from './constants';

const log = debug('laconic:test');

const ERR_PEER_INIT_TIMEOUT = 'Peer intialization timed out';
const ERR_PEER_CONNECTIONS = 'Peer connections timed out';

export const SCRIPT_GET_PEER_ID = 'return window.peer.peerId?.toString()';
const SCRIPT_PEER_INIT = "return (typeof window.peer !== 'undefined') && window.peer.node.isStarted();";
const SCRIPT_GET_PEER_CONNECTIONS = `return window.peer.node.getConnections().map(connection => {
  return connection.remotePeer.toString();
});`;

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const capabilities = {
  'bstack:options': {
    os: 'Windows',
    osVersion: '11',
    browserVersion: '110.0',
    buildName: 'Automated-peer-test-build-1',
    sessionName: 'Parallel test 1'
  },
  browserName: 'Chrome'
};

export async function setupBrowsersWithCapabilities (serverURL: string, capabilities: webdriver.Capabilities): Promise<WebDriver[]> {
  let peerDrivers: WebDriver[] = [];

  try {
    const peerDriverPromises: Promise<ThenableWebDriver>[] = [];
    for (let i = 0; i < TOTAL_PEERS; i++) {
      peerDriverPromises.push(startABrowserPeer(serverURL, capabilities));
    }

    peerDrivers = await Promise.all(peerDriverPromises);
    log('All browser peers started');
  } catch (err) {
    log('Setup failed');
    peerDrivers.forEach(async (driver) => {
      await driver.executeScript(
        'browserstack_executor: {"action": "setSessionStatus", "arguments": {"status":"failed","reason": "Some elements failed to load!"}}'
      );
    });

    throw err;
  }

  return peerDrivers;
}

export const startABrowserPeer = async (serverURL: string, capabilities: webdriver.Capabilities): Promise<webdriver.ThenableWebDriver
> => {
  const prefs = new logging.Preferences();
  prefs.setLevel(logging.Type.BROWSER, logging.Level.ALL);

  const driver = new webdriver.Builder()
    .usingServer(serverURL)
    .withCapabilities(capabilities)
    .setLoggingPrefs(prefs)
    .build();

  const appURL = process.env.TEST_APP_URL;
  if (!appURL) {
    throw new Error('App URL not provided');
  }

  await driver.get(appURL);

  // Wait for the peer node to start
  const condition = new webdriver.Condition('peer initialization', (driver) => {
    return driver.executeScript(SCRIPT_PEER_INIT);
  });
  await driver.wait(condition, NODE_START_TIMEOUT, ERR_PEER_INIT_TIMEOUT, NODE_START_CHECK_INTERVAL);

  return driver;
};

// Wait for the peer node to be connected to one of the provided peer ids
export const waitForConnection = async (peerDriver: WebDriver, peerIds: string[]): Promise<void> => {
  const condition = new webdriver.Condition('peer connection', async (driver) => {
    const connectedPeerIds: string[] = await driver.executeScript(SCRIPT_GET_PEER_CONNECTIONS);

    // If only one peer spinned up, peer connected if connects to any one peer
    if (peerIds.length <= 1) {
      return connectedPeerIds.length > 0;
    }

    // Peer connected to the network if connects to at least of the given speers
    for (const peerId of peerIds) {
      if (connectedPeerIds.includes(peerId)) {
        return true;
      }
    }

    return false;
  });

  await peerDriver.wait(condition, NODE_PEER_CONN_TIMEOUT, ERR_PEER_CONNECTIONS, NODE_PEER_CONN_CHECK_INTERVAL);
};

export const sendFlood = async (peerDriver: WebDriver, msg: string): Promise<void> => {
  const floodScript = `floodMessage("${msg}")`;
  await peerDriver.executeScript(floodScript);
};

export const getLogs = async (peerDriver: WebDriver): Promise<string[]> => {
  const logEntries = await peerDriver.manage().logs().get(webdriver.logging.Type.BROWSER);
  return logEntries.map(log => log.message);
};

export const quitBrowsers = async (peerDrivers: WebDriver[]): Promise<void> => {
  log('Stopping all browser instances');
  await Promise.all(peerDrivers.map(peerDriver => peerDriver.quit()));
};

export const markSessionAsFailed = async (peerDrivers: WebDriver[]): Promise<void> => {
  log('Setting the status to failed');
  await Promise.all(peerDrivers.map(async (peerDriver) => {
    await peerDriver.executeScript(
      'browserstack_executor: {"action": "setSessionStatus", "arguments": {"status":"failed","reason": "Some elements failed to load!"}}'
    );
  }));
};
