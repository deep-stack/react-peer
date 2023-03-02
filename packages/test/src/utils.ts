import webdriver, { WebDriver, logging } from 'selenium-webdriver';

import {
  NODE_START_TIMEOUT,
  NODE_PEER_CONN_TIMEOUT,
  NODE_START_CHECK_INTERVAL,
  NODE_PEER_CONN_CHECK_INTERVAL
} from './constants';

const ERR_PEER_INIT_TIMEOUT = 'Peer intialization timed out';
const ERR_PEER_CONNECTIONS = 'Peer connections timed out';

const SCRIPT_PEER_INIT = "return (typeof window.peer !== 'undefined') && window.peer.node.isStarted();";
const SCRIPT_GET_PEER_CONNECTIONS = `return window.peer.node.getConnections().map(connection => {
  return connection.remotePeer.toString();
});`;

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface TestState {
  isRetry: boolean;
  successful: boolean;
  aborted: boolean;
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

  const appURL = process.env.PEER_TEST_APP_URL;
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
