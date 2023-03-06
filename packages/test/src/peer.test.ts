import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import path from 'path';
import * as dotenv from 'dotenv';
import debug from 'debug';
import 'mocha';
import { expect } from 'chai';
import webdriver, { until, WebDriver } from 'selenium-webdriver';

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
  navigateURL,
  markSessionAsPassed
} from './utils';
import { FLOOD_CHECK_DELAY, ONE_SECOND } from './constants';
import xpaths from '../helpers/elements-xpaths.json';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const log = debug('laconic:test');

const BSTACK_SERVER_URL = `http://${process.env.BSTACK_USERNAME}:${process.env.BSTACK_ACCESS_KEY}@hub-cloud.browserstack.com/wd/hub`;

interface Arguments {
  mobymask: boolean;
}

let peerDrivers: WebDriver[] = [];
let peerIds: string[] = [];

describe('peer-test', () => {
  afterEach(async function () {
    if (this.currentTest?.state !== 'passed') {
      // Mark the Browserstack sessions as failed
      await markSessionAsFailed(peerDrivers);

      // Quit browser instances
      await quitBrowsers(peerDrivers);
    }
  });

  after('after outside', async function () {
    if (this.currentTest?.state !== 'passed') {
      // Mark the Browserstack sessions as failed
      await markSessionAsFailed(peerDrivers);
    } else {
      // Mark the Browserstack sessions as passed
      await markSessionAsPassed(peerDrivers);
    }

    // Quit browser instances
    await quitBrowsers(peerDrivers);
  });

  describe('peer-connectivity-tests', () => {
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
  });

  const args = _getArgv();

  (args.mobymask ? describe : describe.skip)('mobymask-app-tests', () => {
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
        // Wait for message block to be populated within a timeout
        await reportReceiver.wait(async () => {
          const msgs = await reportReceiver.findElements(webdriver.By.xpath(xpaths.mobyDebugMessages));
          return msgs.length !== 0;
        }, FLOOD_CHECK_DELAY);

        // Access message block
        const debugMessages = await reportReceiver.findElements(webdriver.By.xpath(xpaths.mobyDebugMessages));

        // Read all the messages received
        const messages = await Promise.all(
          debugMessages.map(msg => msg.getText())
        );

        // Check if message includes the phisher reports
        for (const expectedPhisherReport of expectedPhisherReports) {
          expect(messages).to.include(expectedPhisherReport);
        }
      }));
    });

    it('peers send and receive member endorsements', async () => {
      // To be run along with the above test

      // Select first peer as the phishing reporter, rest as report receivers
      const reportSender = peerDrivers[0];
      const reportReceivers = peerDrivers.slice(1);

      // Test input values
      const members = ['member1', 'member2'];
      const expectedMemberEndorsements = members.map(member => `method: claimIfMember, value: TWT:${member}`);

      // Load members elements
      const claimMemberInput = await reportSender.findElement(webdriver.By.xpath(xpaths.mobyMemberInputBox));
      const claimMemberButton = await reportSender.findElement(webdriver.By.xpath(xpaths.mobyMemberAddToBatchButton));

      // Populate member input boxes
      for (const member of members) {
        await claimMemberInput.clear();
        await claimMemberInput.sendKeys(member);
        await claimMemberButton.click();
      }

      // Submit batch of members to p2p network
      const submitMemberBatchButton = await reportSender.findElement(webdriver.By.xpath(xpaths.mobyMemberSubmitBatchButton));
      await submitMemberBatchButton.click();

      // Wait before checking for flood messages
      await sleep(FLOOD_CHECK_DELAY);

      await Promise.all(reportReceivers.map(async (reportReceiver) => {
        // Wait for message block to be populated within a timeout
        await reportReceiver.wait(async () => {
          const msgs = await reportReceiver.findElements(webdriver.By.xpath(xpaths.mobyDebugMessages));
          return msgs.length !== 0;
        }, FLOOD_CHECK_DELAY);

        // Access message block
        const debugMessages = await reportReceiver.findElements(webdriver.By.xpath(xpaths.mobyDebugMessages));

        // Read all the messages received
        const messages = await Promise.all(
          debugMessages.map(msg => msg.getText())
        );

        // Check if message includes the member endorsements
        for (const expectedMemberEndorsement of expectedMemberEndorsements) {
          expect(messages).to.include(expectedMemberEndorsement);
        }
      }));
    });

    describe('test invite links', async() => {
      let invitor: webdriver.WebDriver;
      let invitee: webdriver.WebDriver;
      let secondaryInvitee: webdriver.WebDriver;
      let reportReceivers : webdriver.WebDriver[];

      // Select first peer as the phishing reporter, rest as report receivers
      before('setup drivers', async function () {
        if (peerDrivers.length < 2) {
          log('Skipping this section as number of peers < 2');
          this.skip();
        }

        invitor = peerDrivers[0];
        invitee = peerDrivers[1];
        reportReceivers = peerDrivers.slice(2).concat(invitor);
      });

      it('members can create invite links for other peers', async () => {
        // Create a new invite link for Member1
        const createInviteButton = await invitor.findElement(webdriver.By.xpath(xpaths.mobyMemberCreateInvite));
        await createInviteButton.click();

        await invitor.wait(until.alertIsPresent(), 3 * ONE_SECOND);
        await invitor.switchTo().alert().sendKeys("Member1");
        await invitor.switchTo().alert().accept();

        // Wait for confirmation alert
        await invitor.wait(until.alertIsPresent(), 3 * ONE_SECOND);
        await invitor.switchTo().alert().accept();

        // Click on the dropdown to make links visible
        const dropDown = invitor.findElement(webdriver.By.xpath(xpaths.mobyMemberDropDown));
        await dropDown.click();

        // Get the recently created invite link
        const outstandingLinkElements = await invitor.findElements(webdriver.By.xpath(xpaths.mobyMemberInviteLink));
        const latestLink = await outstandingLinkElements.slice(-1)[0].getAttribute('value');

        // Close invitee's debug panel
        const debugCloseButton = await invitee.findElement(webdriver.By.xpath(xpaths.mobyDebugPanelClose));
        debugCloseButton.click();

        // Let invitee peer navigate to the created invite link
        await navigateURL(invitee, latestLink);
        expect(invitee.wait(until.elementsLocated(webdriver.By.xpath(xpaths.mobyMemberCreateInvite)), 10 * ONE_SECOND)).to.not.throw;
      });

      it('invitee can make member endorsements', async () => {
        // Let peer call claimIfMember
        const members = ['member1', 'member2'];
        const expectedMemberEndorsements = members.map(member => `method: claimIfMember, value: TWT:${member}`);

        // Load members elements
        const claimMemberInput = await invitee.findElement(webdriver.By.xpath(xpaths.mobyMemberInputBox));
        const claimMemberButton = await invitee.findElement(webdriver.By.xpath(xpaths.mobyMemberAddToBatchButton));

        // Populate member input boxes
        for (const member of members) {
          await claimMemberInput.clear();
          await claimMemberInput.sendKeys(member);
          await claimMemberButton.click();
        }

        // Submit batch of members to p2p network
        const submitMemberBatchButton = await invitee.findElement(webdriver.By.xpath(xpaths.mobyMemberSubmitBatchButton));
        await submitMemberBatchButton.click();

        // Wait before checking for flood messages
        await sleep(FLOOD_CHECK_DELAY);

        // Check if other peers receive the messages
        await Promise.all(reportReceivers.map(async (reportReceiver) => {
          // Access message block
          const debugMessages = await reportReceiver.findElements(webdriver.By.xpath(xpaths.mobyDebugMessages));

          // Read all the messages received
          const messages = await Promise.all(
            debugMessages.map(msg => msg.getText())
          );

          // Check if message includes the member endorsements
          for (const expectedMemberEndorsement of expectedMemberEndorsements) {
            expect(messages).to.include(expectedMemberEndorsement);
          }
        }));
      });

      it('check if invitee can create an invite link', async () => {
        secondaryInvitee = peerDrivers[2];

        // Create a secondary invite link for Member2
        const createInviteButton = await invitor.findElement(webdriver.By.xpath(xpaths.mobyMemberCreateInvite));
        await createInviteButton.click();

        await invitor.wait(until.alertIsPresent(), 3 * ONE_SECOND);
        await invitor.switchTo().alert().sendKeys("Member2");
        await invitor.switchTo().alert().accept();

        await invitor.wait(until.alertIsPresent(), 3 * ONE_SECOND);
        await invitor.switchTo().alert().accept();

        // Click on the dropdown to make links visible
        const dropDown = invitor.findElement(webdriver.By.xpath(xpaths.mobyMemberDropDown));
        await dropDown.click();

        // Get the recently created invite link
        const outstandingLinkElements = await invitor.findElements(webdriver.By.xpath(xpaths.mobyMemberInviteLink));
        const latestLink = await outstandingLinkElements.slice(-1)[0].getAttribute('value');

        await navigateURL(secondaryInvitee, latestLink);
        expect(secondaryInvitee.wait(until.elementsLocated(webdriver.By.xpath(xpaths.mobyMemberCreateInvite)), 10 * ONE_SECOND)).to.not.throw;
      });
    });
  });

  (args.mobymask ? describe.skip : describe)('test-app-tests', () => {
    it('peers send and receive flood messages', async () => {
      // Skip/pass this test if testing with < 2 peers
      if (peerDrivers.length < 2) {
        log('Skipping test as number of peers < 2')
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
  });
});

function _getArgv (): Arguments {
  return yargs(hideBin(process.argv)).parserConfiguration({
    'parse-numbers': false
  }).options({
    mobymask: {
      type: 'boolean',
      describe: "Whether to run mobymask tests",
      default: false
    }
  }).parseSync();
}

process.on('SIGINT', async () => {
  // Quit browser instances
  await quitBrowsers(peerDrivers);

  log(`Exiting process ${process.pid} with code 0`);
  process.exit(0);
});
