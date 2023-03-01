const { TOTAL_PEERS } = require('./constants.js');
const { runTestWithCapabilities } =  require('./peer.test.js');

const capabilities = {
  'bstack:options' : {
      "os": "Windows",
      "osVersion": "11",
      "browserVersion": "110.0",
      "buildName" : "Automated-peer-test-build-1",
      "sessionName" : "Parallel test 1",
  },
  "browserName": "Chrome"
};

async function main() {
  var instances = [];
  for (var i = 0; i<TOTAL_PEERS; i++) {
    instances.push(runTestWithCapabilities(capabilities));
  }

  // Launches browser instances on Browserstack parallelly
  await Promise.all(instances);
}

main().catch(function(e){
  console.log(e);
});
