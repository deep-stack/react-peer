import webdriver, { WebDriver } from 'selenium-webdriver';
import debug from 'debug';

import { runTestWithCapabilities, setupBrowsersWithCapabilities } from './peer.test.js';
import { quitBrowsers } from './utils.js';

const log = debug('laconic:test');

const capabilities = {
  'bstack:options': {
    os: 'Windows',
    osVersion: '11',
    browserVersion: '110.0',
    buildName: 'Automated-peer-test-build-1',
    sessionName: 'Parallel test 1'
  },
  browserName: 'Chrome'
};

let peerDrivers: WebDriver[] = [];

// TODO: Test with mobymask app
async function main () {
  // Launch browser instances on Browserstack
  const chromeInWindowsCapabilities = new webdriver.Capabilities(new Map(Object.entries(capabilities)));
  peerDrivers = await setupBrowsersWithCapabilities(chromeInWindowsCapabilities);
  await runTestWithCapabilities(peerDrivers);
}

main().catch(err => {
  log(err);
}).finally(() => {
  process.exit();
});

process.on('SIGINT', async () => {
  // Quit browser instances
  await quitBrowsers(peerDrivers);

  log(`Exiting process ${process.pid} with code 0`);
  process.exit(0);
});
