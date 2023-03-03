import path from 'path';
import * as dotenv from 'dotenv';
import debug from 'debug';
import 'mocha';
import { expect } from 'chai';
import webdriver, { WebDriver } from 'selenium-webdriver';

import {
  waitForConnection,
  sendFlood,
  getLogs,
  sleep,
  quitBrowsers,
  capabilities,
  setupBrowsersWithCapabilities,
  SCRIPT_GET_PEER_ID,
  markSessionAsFailed,
  TEST_APP_MEMBER_URL,
  navigateURL
} from './utils';
import { FLOOD_CHECK_DELAY } from './constants';
import xpaths from '../helpers/elements-xpaths.json';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const log = debug('laconic:test');

const BSTACK_SERVER_URL = `http://${process.env.BSTACK_USERNAME}:${process.env.BSTACK_ACCESS_KEY}@hub-cloud.browserstack.com/wd/hub`;

let peerDrivers: WebDriver[] = [];

describe('peer-test', () => {
  let peerIds: string[];

  before('setup browsers', async () => {
    log('Setting up the browsers')

    const chromeInWindowsCapabilities = new webdriver.Capabilities(new Map(Object.entries(capabilities)));
    peerDrivers = await setupBrowsersWithCapabilities(BSTACK_SERVER_URL, chromeInWindowsCapabilities);

    peerIds = await Promise.all(peerDrivers.map((peerDriver): Promise<string> => {
      return peerDriver.executeScript(SCRIPT_GET_PEER_ID);
    }));

    log('Setup done')
  });

  it('every peer connects to at least one of the simulated peers', async () => {
    await Promise.all(peerDrivers.map((peerDriver): Promise<void> => {
      return waitForConnection(peerDriver, peerIds);
    }));
  });

  it('peers send and receive phisher reports', async () => {
    if (!TEST_APP_MEMBER_URL) {
      throw new Error('App URL (member) not provided');
    }

    // Select first peer as the phishing reporter, rest as report receivers
    const reportSender = peerDrivers[0];
    const reportReceivers = peerDrivers.slice(1);

    // Navigate to app url
    await navigateURL(reportSender, TEST_APP_MEMBER_URL);

    await Promise.all(reportReceivers.map(async (reportReceiver): Promise<void> => {
      // Open debug panel
      const debugButton = await reportReceiver.findElement(webdriver.By.xpath(xpaths.mobyDebugPanelOpen));
      await debugButton.click();

      // Switch to messages pane
      const messagesPaneButton = await reportReceiver.findElement(webdriver.By.xpath(xpaths.mobyDebugMessagePanelButton));
      await messagesPaneButton.click();
    }));

    // Test input values
    const phishers = ['phisher1', 'phisher2'];
    const expectedPhisherReports = phishers.map(phisher => `method: claimIfPhisher, value: TWT:${phisher}`);

    // Load phishers elements
    const claimPhisherInput = await reportSender.findElement(webdriver.By.xpath(xpaths.mobyPhisherInputBox));
    const claimPhisherButton = await reportSender.findElement(webdriver.By.xpath(xpaths.mobyPhisherAddToBatchButton));

    // Populate phisher input boxes
    for (const phisher of phishers) {
      await claimPhisherInput.clear();
      await claimPhisherInput.sendKeys(phisher);
      await claimPhisherButton.click();
    }

    // Submit batch of phishers to p2p network
    const submitPhisherBatchButton = await reportSender.findElement(webdriver.By.xpath(xpaths.mobyPhisherSubmitBatchButton));
    await submitPhisherBatchButton.click();

    // Wait before checking for flood messages
    await sleep(FLOOD_CHECK_DELAY);

    await Promise.all(reportReceivers.map(async (reportReceiver) => {
      // Access message block
      const messageBlock = await reportReceiver.findElement(webdriver.By.xpath(xpaths.mobyDebugMessageBlock));

      // Wait for it to be populated within a timeout
      await reportReceiver.wait(async () => {
        const msgs = await messageBlock.getText();
        return msgs !== '';
      }, FLOOD_CHECK_DELAY);

      const messages = await messageBlock.getText();

      // Check if message include the phisher reports
      for (const expectedPhisherReport of expectedPhisherReports) {
        expect(messages).to.include(expectedPhisherReport);
      }
    }));
  });

  xit('peers send and receive flood messages', async () => {
    // TODO: Skip if total peers <= 1

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

    // Wait before checking for flood messages
    await sleep(FLOOD_CHECK_DELAY);

    // Check that flood has been received by all the peers
    const peerLogsEntries = await Promise.all(peerDrivers.map((peerDriver): Promise<string[]> => {
      return getLogs(peerDriver);
    }));

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

      expect(expectedFloodMessagesForPeer, `Messages not received by peer ${peerId}: ${JSON.stringify(expectedFloodMessagesForPeer, null, 2)}`).to.be.empty;
    });
  });

  afterEach(async function () {
    if (this.currentTest?.state === 'failed') {
      // Mark the Browserstack sessions as failed
      await markSessionAsFailed(peerDrivers);

      // Quit browser instances
      await quitBrowsers(peerDrivers);
    }
  });

  after(async function () {
    if (this.currentTest?.state === 'failed') {
      // Mark the Browserstack sessions as failed
      await markSessionAsFailed(peerDrivers);
    }

    // Quit browser instances
    await quitBrowsers(peerDrivers);
  });
});

process.on('SIGINT', async () => {
  // Quit browser instances
  await quitBrowsers(peerDrivers);

  log(`Exiting process ${process.pid} with code 0`);
  process.exit(0);
});
