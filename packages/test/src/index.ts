import { runTestWithCapabilities } from './peer.test.js';
import { TOTAL_PEERS } from './constants';

const capabilities: any = {
  'bstack:options': {
    os: 'Windows',
    osVersion: '11',
    browserVersion: '110.0',
    buildName: 'Automated-peer-test-build-1',
    sessionName: 'Parallel test 1'
  },
  browserName: 'Chrome'
};

async function main () {
  const instances = [];
  for (let i = 0; i < TOTAL_PEERS; i++) {
    instances.push(runTestWithCapabilities(capabilities));
  }

  // Launches browser instances on Browserstack parallelly
  await Promise.all(instances);
}

main().catch(err => {
  console.log(err);
}).finally(() => {
  process.exit();
});
