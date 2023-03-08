/* eslint-disable no-unused-expressions */

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
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
  quitBrowsers,
  capabilities,
  setupBrowsersWithCapabilities,
  markSessionAsFailed,
  navigateURL,
  markSessionAsPassed,
  SCRIPT_GET_PEER_ID
} from './driver-utils';
import { FLOOD_CHECK_DELAY } from './constants';
import { testInvitation, testInviteRevocation, testMemberEndorsements, testPhisherReports } from './helpers';
import { TEST_APP_MEMBER_URL, sleep } from './utils';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const log = debug('laconic:test');

const BSTACK_SERVER_URL = `http://${process.env.BSTACK_USERNAME}:${process.env.BSTACK_ACCESS_KEY}@hub-cloud.browserstack.com/wd/hub`;

interface Arguments {
  mobymask: boolean;
}

let peerDrivers: WebDriver[] = [];
let peerIds: string[] = [];

// Use a flag since we cannot access currentTest.state in the after hook
// https://stackoverflow.com/a/22050548/12594335
let testFailed = false;

describe('peer-test', () => {
  afterEach(async function () {
    // Skip block if test is skipped
    if (this.currentTest?.state === 'pending') {
      return;
    }

    testFailed = this.currentTest?.state === 'failed';

    if (testFailed) {
      // Mark the Browserstack sessions as failed
      await markSessionAsFailed(peerDrivers);

      // Quit browser instances
      await quitBrowsers(peerDrivers);
    }
  });

  after('after outside', async function () {
    if (!testFailed) {
      // Mark the Browserstack sessions as passed
      await markSessionAsPassed(peerDrivers);
    }

    // Quit browser instances
    await quitBrowsers(peerDrivers);
  });

  describe('peer-connectivity-tests', () => {
    before('setup browsers', async () => {
      log('Setting up the browsers');

      // Try setting up the browsers and exit if any error is thrown
      try {
        const chromeInWindowsCapabilities = new webdriver.Capabilities(new Map(Object.entries(capabilities)));
        peerDrivers = await setupBrowsersWithCapabilities(BSTACK_SERVER_URL, chromeInWindowsCapabilities);

        peerIds = await Promise.all(peerDrivers.map((peerDriver): Promise<string> => {
          return peerDriver.executeScript(SCRIPT_GET_PEER_ID);
        }));
      } catch (err) {
        log('Error while setting up browsers');

        // Mark the Browserstack sessions as failed
        testFailed = true;
        await markSessionAsFailed(peerDrivers);

        throw (err);
      }

      log('Setup done');
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

      // Test input values
      const phishers = ['phisher1', 'phisher2'];
      await testPhisherReports(reportSender, reportReceivers, phishers);
    });

    it('peers send and receive member endorsements', async () => {
      // To be run along with the above test

      // Select first peer as the phishing reporter, rest as report receivers
      const reportSender = peerDrivers[0];
      const reportReceivers = peerDrivers.slice(1);

      // Test input values
      const members = ['member1', 'member2'];
      await testMemberEndorsements(reportSender, reportReceivers, members);
    });

    // TODO: Reuse code from previous tests
    describe('test invite links', async () => {
      let invitor: webdriver.WebDriver;
      let invitee: webdriver.WebDriver;
      let inviteLink: string;

      let secondaryInvitee: webdriver.WebDriver;
      let secondaryInviteLink: string;

      let reportReceivers : webdriver.WebDriver[];

      // Select first peer as the phishing reporter, rest as report receivers
      before('setup drivers', async function () {
        if (peerDrivers.length < 2) {
          log('Skipping this section as number of peers < 2');
          this.skip();
        }

        invitor = peerDrivers[0];
        invitee = peerDrivers[1];
      });

      it('members can create invite links for other peers', async () => {
        inviteLink = await testInvitation(invitor, invitee, 'Member1');
      });

      it('invited members can make member endorsements', async () => {
        // Test input values
        const members = ['invitee-member1', 'invitee-member2'];
        reportReceivers = peerDrivers.slice(2).concat(invitor);

        await testMemberEndorsements(invitee, reportReceivers, members);
      });

      it('invited members can create invite links for other peers', async () => {
        // Skip this test if number of peers < 3
        if (peerDrivers.length < 3) {
          log('Skipping this test as number of peers < 3');
          return;
        }

        secondaryInvitee = peerDrivers[2];

        secondaryInviteLink = await testInvitation(invitee, secondaryInvitee, 'Member2');
      });

      it('secondary invitees can make member endorsements', async () => {
        // Skip this test if number of peers < 3
        if (peerDrivers.length < 3) {
          log('Skipping this test as number of peers < 3');
          return;
        }

        // Test input values
        const members = ['sec-invitee-member1', 'sec-invitee-member2'];
        reportReceivers = peerDrivers.slice(0, 2).concat(peerDrivers.slice(3));

        await testMemberEndorsements(secondaryInvitee, reportReceivers, members);
      });

      it('invited members can revoke invites created by them', async () => {
        // To be run along with the test to create invite link from invited members
        // Skip this test if number of peers < 3
        if (peerDrivers.length < 3) {
          log('Skipping this test as number of peers < 3');
          return;
        }

        // Reassign report receivers
        reportReceivers = peerDrivers.slice(2).concat(peerDrivers[0]);

        await testInviteRevocation(invitee, reportReceivers, secondaryInviteLink);
      });

      it('members can revoke invites', async () => {
        // To be run along with the test to create invite link from members

        // Reassign report receivers
        reportReceivers = peerDrivers.slice(1);

        await testInviteRevocation(invitor, reportReceivers, inviteLink);
      });
    });
  });

  (args.mobymask ? describe.skip : describe)('test-app-tests', () => {
    it('peers send and receive flood messages', async () => {
      // Skip/pass this test if testing with < 2 peers
      if (peerDrivers.length < 2) {
        log('Skipping test as number of peers < 2');
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
      describe: 'Whether to run mobymask tests',
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
