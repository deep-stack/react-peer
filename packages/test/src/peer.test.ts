import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
import webdriver, { logging } from 'selenium-webdriver';

import { TestState, trackPeerConnections, floodTest, getConnections } from './utils.js';
import { MIN_REQUIRED_CONNECTIONS, NODE_START_TIMEOUT } from './constants.js';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export async function runTestWithCapabilities (capabilities: webdriver.Capabilities) {
  const prefs = new logging.Preferences();
  prefs.setLevel(logging.Type.BROWSER, logging.Level.ALL);

  const driver = new webdriver.Builder()
    .usingServer(`http://${process.env.BSTACK_USERNAME}:${process.env.BSTACK_ACCESS_KEY}@hub-cloud.browserstack.com/wd/hub`)
    .withCapabilities(capabilities)
    .setLoggingPrefs(prefs)
    .build();

  try {
    const appURL = process.env.PEER_TEST_APP_URL;
    if (!appURL) {
      throw new Error('App URL not provided');
    }

    await driver.get(appURL);

    // TODO: Use HTML id tags for selecting elements
    const xpaths = JSON.parse(fs.readFileSync('elements-xpaths.json').toString());

    // Wait for the peer node to start
    // TODO: Check that awaiting on the element works
    const nodeStartedElement = await driver.findElement(webdriver.By.xpath(xpaths.nodeStartedXpath));
    await driver.wait(async () => {
      const hasNodeStarted = await nodeStartedElement.getText();
      return hasNodeStarted === 'true';
    }, NODE_START_TIMEOUT);

    // Fetch peer id
    const peerIdElement = await driver.findElement(webdriver.By.xpath(xpaths.peerIdXpath));
    await driver.wait(async function () {
      const peerId = await peerIdElement.getText();
      return peerId !== '';
    }, NODE_START_TIMEOUT);
    const peerId = await peerIdElement.getText();

    // Wait for sufficient connections
    // TODO: Use a better heuristic
    const peerConnectionsElement = await driver.findElement(webdriver.By.xpath(xpaths.peerConnectionsXpath));
    await driver.wait(async function () {
      const connectionCount = await getConnections(peerConnectionsElement);
      return connectionCount >= MIN_REQUIRED_CONNECTIONS;
    }, NODE_START_TIMEOUT);

    const testState: TestState = {
      isRetry: false,
      successful: false,
      aborted: false
    };

    await Promise.all([
      trackPeerConnections(peerConnectionsElement, testState),
      floodTest(driver, peerId, testState)
    ]);
  } catch (err) {
    await driver.executeScript(
      'browserstack_executor: {"action": "setSessionStatus", "arguments": {"status":"failed","reason": "Some elements failed to load!"}}'
    );
  }
  await driver.quit();
}
