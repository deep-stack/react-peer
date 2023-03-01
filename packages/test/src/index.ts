import webdriver from 'selenium-webdriver';

import { runTestWithCapabilities } from './peer.test.js';
import { TOTAL_PEERS } from './constants';

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

// TODO: Test with mobymask app
async function main () {
  // Launch browser instances on Browserstack
  const chromeInWindowsCapabilities = new webdriver.Capabilities(new Map(Object.entries(capabilities)));
  const instances = [];
  for (let i = 0; i < TOTAL_PEERS; i++) {
    instances.push(runTestWithCapabilities(chromeInWindowsCapabilities));
  }

  await Promise.all(instances);
}

main().catch(err => {
  console.log(err);
}).finally(() => {
  process.exit();
});
