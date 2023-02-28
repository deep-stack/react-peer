import { TOTAL_PEERS } from './constants';
import { runTestWithCapabilities } from './peer.test';

const capabilities = {
  'bstack:options' : {
      "os": "Windows",
      "osVersion": "11",
      "browserVersion": "110.0",
      "buildName" : "Peer-test-automation-build-1",
      "sessionName" : "Parallel test 1",
  },
  "browserName": "Chrome"
};  

async function main() {
  var instances = [];
  for (var i = 0; i<TOTAL_PEERS; i++) {
    instances.push(runTestWithCapabilities(capabilities));
  }
  await Promise.all(instances);
}

main().catch(function(e){
  console.log(e);
});
