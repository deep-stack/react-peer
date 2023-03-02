import path from 'path';
import * as dotenv from 'dotenv';
import debug from 'debug';
import webdriver, { ThenableWebDriver, WebDriver } from 'selenium-webdriver';

import { startABrowserPeer, waitForConnection, sendFlood, getLogs, sleep, quitBrowsers } from './utils.js';
import { FLOOD_CHECK_DELAY, TOTAL_PEERS } from './constants.js';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const log = debug('laconic:test');

const BSTACK_SERVER_URL = `http://${process.env.BSTACK_USERNAME}:${process.env.BSTACK_ACCESS_KEY}@hub-cloud.browserstack.com/wd/hub`;

export async function setupBrowsersWithCapabilities (capabilities: webdriver.Capabilities): Promise<WebDriver[]> {
  let peerDrivers: WebDriver[] = [];

  try {
    const peerDriverPromises: Promise<ThenableWebDriver>[] = [];
    for (let i = 0; i < TOTAL_PEERS; i++) {
      peerDriverPromises.push(startABrowserPeer(BSTACK_SERVER_URL, capabilities));
    }

    peerDrivers = await Promise.all(peerDriverPromises);
    log('All browser peers started');
  } catch (err) {
    log('Setup failed with err:');
    log(err);
    peerDrivers.forEach(async (driver) => {
      await driver.executeScript(
        'browserstack_executor: {"action": "setSessionStatus", "arguments": {"status":"failed","reason": "Some elements failed to load!"}}'
      );
    });
  }

  return peerDrivers;
}

export async function runTestWithCapabilities (peerDrivers: WebDriver[]): Promise<void> {
  try {
    const peerIds = await Promise.all(peerDrivers.map((peerDriver): Promise<string> => {
      return peerDriver.executeScript('return window.peer.peerId?.toString()');
    }));

    log('PeerIds', peerIds);

    // Wait for peers to connect to one of the peer ids
    await Promise.all(peerDrivers.map((peerDriver): Promise<void> => {
      return waitForConnection(peerDriver, peerIds);
    }));

    log('All browser peers connected');

    // Skip flood checks if <= 1 peers setup
    if (TOTAL_PEERS <= 1) {
      return;
    }

    const expectedFloodMessages: Map<string, string> = new Map();
    const floodMessages = peerIds.map(peerId => {
      const msg = `This is ${peerId}`;
      expectedFloodMessages.set(peerId, `${peerId} > ${msg}`);

      return msg;
    });

    // Send flood messages
    await Promise.all(peerDrivers.map((peerDriver, index): Promise<void> => {
      return sendFlood(peerDriver, floodMessages[index]);
    }));

    log('All floods sent');

    // Wait before checking for flood messages
    await sleep(FLOOD_CHECK_DELAY);

    // Check that flood has been received by all the peers
    const peerLogsEntries = await Promise.all(peerDrivers.map((peerDriver): Promise<string[]> => {
      return getLogs(peerDriver);
    }));

    log('All logs fetched');

    peerLogsEntries.forEach((peerLogs, index) => {
      const peerId = peerIds[index];

      const expectedFloodMessagesForPeer = new Map(expectedFloodMessages);
      expectedFloodMessagesForPeer.delete(peerId); // Avoid messages from self

      for (const log of peerLogs) {
        if (expectedFloodMessagesForPeer.size === 0) {
          break;
        }

        expectedFloodMessagesForPeer.forEach((value, key) => {
          if (log.includes(value)) {
            expectedFloodMessagesForPeer.delete(key);
          }
        });
      }

      if (expectedFloodMessagesForPeer.size !== 0) {
        throw new Error(`Messages not received by peer ${peerId}: ${expectedFloodMessagesForPeer} `);
      }
    });

    log('All checks done');
  } catch (err) {
    log('Test failed with err:');
    log(err);
    peerDrivers.forEach(async (driver) => {
      await driver.executeScript(
        'browserstack_executor: {"action": "setSessionStatus", "arguments": {"status":"failed","reason": "Some elements failed to load!"}}'
      );
    });
  } finally {
    // Quit browser instances
    await quitBrowsers(peerDrivers);
  }
}
