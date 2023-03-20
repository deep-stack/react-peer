/* eslint-disable no-unused-expressions */

import 'mocha';
import { expect } from 'chai';
import webdriver, { until, WebDriver } from 'selenium-webdriver';

import {
  MOBYMASK_MESSAGE_KINDS,
  getSignedDelegationFromInvite
} from './utils';
import { MESSAGE_ARRIVAL_TIMEOUT } from '../constants';
import xpaths from './elements-xpaths.json';
import { closeDebugPanel, navigateURL, openDebugPanel, scrollElementIntoView, waitForMessage } from '../driver-utils';

export async function testPhisherReports (reportSender: WebDriver, reportReceivers: WebDriver[], phishers: string[]): Promise<void> {
  // Open debug panel on the report receivers
  await openDebugPanel(reportReceivers);

  // Test input values
  const expectedPhisherReports = phishers.map(phisher => `method: claimIfPhisher, value: TWT:${phisher}`);
  const expectedData = phishers.map(phisher => {
    return { name: 'claimIfPhisher', value: phisher };
  });

  // Load phishers elements
  const claimPhisherInput = await reportSender.findElement(webdriver.By.xpath(xpaths.mobyPhisherInputBox));
  const claimPhisherButton = await reportSender.findElement(webdriver.By.xpath(xpaths.mobyPhisherAddToBatchButton));
  await scrollElementIntoView(claimPhisherButton);

  // Populate phisher input boxes
  for (const phisher of phishers) {
    await claimPhisherInput.clear();
    await claimPhisherInput.sendKeys(phisher);
    await claimPhisherButton.click();
  }

  // Submit batch of phishers to p2p network
  const submitPhisherBatchButton = await reportSender.findElement(webdriver.By.xpath(xpaths.mobyPhisherSubmitBatchButton));
  await scrollElementIntoView(submitPhisherBatchButton);

  // Setup message listeners
  const msgCheckPromises = reportReceivers.map(async (reportReceiver) => {
    await waitForMessage(reportReceiver, MOBYMASK_MESSAGE_KINDS.INVOKE, expectedData);
  });

  await submitPhisherBatchButton.click();
  await Promise.all(msgCheckPromises);

  // Check if other peers receive the messages
  await Promise.all(reportReceivers.map(async (reportReceiver) => {
    // Waiting till the messages have arrived
    expect(reportReceiver.wait(async function () {
      // Read message objects
      const messageElements = await reportReceiver.findElements(webdriver.By.xpath(xpaths.mobyDebugMessages));
      const messages = await Promise.all(
        messageElements.map(msg => msg.getText())
      );

      let messagesArrived = true;
      for (const expectedPhisherReport of expectedPhisherReports) {
        if (!messages.find(msg => msg.includes(expectedPhisherReport))) {
          messagesArrived = false;
        }
      }
      return messagesArrived;
    }, MESSAGE_ARRIVAL_TIMEOUT)).to.not.throw;
  }));

  // Close debug panel on the report receivers
  await closeDebugPanel(reportReceivers);
}

export async function testMemberEndorsements (reportSender: WebDriver, reportReceivers: WebDriver[], members: string[]): Promise<void> {
  // Open debug panel on the report receivers
  await openDebugPanel(reportReceivers);

  // Test input values
  const expectedMemberEndorsements = members.map(member => `method: claimIfMember, value: TWT:${member}`);
  const expectedData = members.map(member => {
    return { name: 'claimIfMember', value: member };
  });

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
  await scrollElementIntoView(submitMemberBatchButton);

  // Setup message listeners
  const msgCheckPromises = reportReceivers.map(async (reportReceiver) => {
    await waitForMessage(reportReceiver, MOBYMASK_MESSAGE_KINDS.INVOKE, expectedData);
  });

  await submitMemberBatchButton.click();
  await Promise.all(msgCheckPromises);

  // Check if other peers receive the messages
  await Promise.all(reportReceivers.map(async (reportReceiver) => {
    // Waiting till the messages have arrived
    expect(reportReceiver.wait(async function () {
      // Read message objects
      const messageElements = await reportReceiver.findElements(webdriver.By.xpath(xpaths.mobyDebugMessages));
      const messages = await Promise.all(
        messageElements.map(msg => msg.getText())
      );

      let messagesArrived = true;
      for (const expectedMemberEndorsement of expectedMemberEndorsements) {
        if (!messages.find(msg => msg.includes(expectedMemberEndorsement))) {
          messagesArrived = false;
        }
      }
      return messagesArrived;
    }, MESSAGE_ARRIVAL_TIMEOUT)).to.not.throw;
  }));

  // Close debug panel on the report receivers
  await closeDebugPanel(reportReceivers);
}

export async function testInvitation (invitor: WebDriver, invitee: WebDriver, inviteeName: string): Promise<string> {
  // Create a new invite link for given inviteeName
  const createInviteButton = await invitor.findElement(webdriver.By.xpath(xpaths.mobyMemberCreateInvite));
  await createInviteButton.click();

  await invitor.wait(until.alertIsPresent(), 5 * 1000); // 5s
  await invitor.switchTo().alert().sendKeys(inviteeName);
  await invitor.switchTo().alert().accept();

  // Wait for confirmation alert
  await invitor.wait(until.alertIsPresent(), 5 * 1000); // 5s
  await invitor.switchTo().alert().accept();

  // Click on the dropdown to make links visible
  const dropDown = await invitor.findElement(webdriver.By.xpath(xpaths.mobyMemberDropDown));
  await scrollElementIntoView(dropDown);
  await dropDown.click();

  // Get the recently created invite link
  const outstandingLinkElements = await invitor.findElements(webdriver.By.xpath(xpaths.mobyMemberInviteLink));
  const latestLink = await outstandingLinkElements.slice(-1)[0].getAttribute('value');

  // Let invitee peer navigate to the created invite link
  await navigateURL(invitee, latestLink);
  expect(invitee.wait(until.elementsLocated(webdriver.By.xpath(xpaths.mobyMemberCreateInvite)), 10 * 1000)).to.not.throw;

  return latestLink;
}

export async function testInviteRevocation (invitor: WebDriver, reportReceivers: WebDriver[], inviteLink: string): Promise<void> {
  const expectedData = getSignedDelegationFromInvite(inviteLink);

  // Load revoke button
  const revokeInviteButton = await invitor.findElement(webdriver.By.xpath(xpaths.mobyMemberRevokeInvite));

  // Setup message listeners
  const msgCheckPromises = reportReceivers.map(async (reportReceiver) => {
    await waitForMessage(reportReceiver, MOBYMASK_MESSAGE_KINDS.REVOKE, expectedData);
  });

  revokeInviteButton.click();
  await Promise.all(msgCheckPromises);
}
