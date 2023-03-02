import webdriver from 'selenium-webdriver';

import { runTestWithCapabilities } from './peer.test.js';

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
  await runTestWithCapabilities(chromeInWindowsCapabilities);
}

main().catch(err => {
  console.log(err);
}).finally(() => {
  process.exit();
});

// TODO: Stop browser instances on SIGINT
// process.on('SIGINT', () => {
//   log(`Exiting process ${process.pid} with code 0`);
//   process.exit(0);
// });
