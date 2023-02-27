const webdriver = require('selenium-webdriver');
var logging = require('selenium-webdriver').logging;

const BrowserstackUsername = '<BrowserStack-Username>'
const BrowserstackAccessKey = '<BrowserStack-AccessKey>'

const nodeStartedXpath = '/html/body/div/main/div/div[1]/div/div/div[2]/table/tbody/tr[1]/td[4]'
const peerIdXpath = '/html/body/div/main/div/div[1]/div/div/div[2]/table/tbody/tr[1]/td[2]'
const peerConnectionsXpath = '/html/body/div/main/div/div[3]/div/div/h6/b/div' 

const args  = {
  MIN_REQUIRED_CONNECTIONS: 4,
  TOTAL_PEERS: 3,
  PING_INTERVAL: 3,
  TEST_INTERVAL:8,
  WAIT_BEFORE_ABORT:10,
  TEST_RETRIES:15,
};

class ConnectionDropped extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

const sleep = sec => new Promise(r => setTimeout(r, sec * 1000));

async function getConnections(connectionElement){
  var connections = await connectionElement.getText().then(function (conns){return conns;} );
  return parseInt(connections);
}

async function trackPeerConnections (element, args, flags){
  while(!flags.testSuccessful && !flags.abortTest){
    try {
      connections = await getConnections(element);
      console.log("Current connections : ", connections);

      if (connections < args.MIN_REQUIRED_CONNECTIONS){
        throw ConnectionDropped("Number of connections less than minimum required for testing.");
      } else {
        await sleep(args.PING_INTERVAL);
      }
    } catch (e) {
      if (e instanceof ConnectionDropped){
        if(flags.isRetry) {
          console.log("Connections still under minimum required, aborting execution.");
          flags.abortTest = True;
        }
        else {
          console.log(e.message);
          console.log("Retrying after a few seconds.")
          flags.isRetry = true;
          await sleep(args.WAIT_BEFORE_ABORT);
        }
      } else {
        console.log("Unexpected error at trackConnections : ", e)
        flags.abortTest = true;
      }
    }
  }
}

async function floodTest(driver, peerId, args, flags){
  const floodFrom = new Map();
  checkMsg = 'Hello from ';
  floodMsg = checkMsg + peerId;
  floodCmd = 'flood("'+floodMsg+'")';
  try {
    var i = 1;
    while(i < args.TEST_RETRIES && !flags.testSuccessful && !flags.abortTest){
      i++;
      console.log("Sending flood message.", peerId);
      await driver.executeScript(floodCmd);
      await sleep(args.TEST_INTERVAL);

      var logEntries = await driver.manage().logs().get(webdriver.logging.Type.BROWSER).then(function (entries){
        var logEntries = [];
        entries.forEach(function(entry){
            var ok = ''+ entry.message;
            if(ok.includes(checkMsg)){
              logEntries = logEntries.concat([ok.split(checkMsg)[1]]);
            }
        });
        return logEntries;
      });

      logEntries.forEach(async function (entry){
          let exists  = floodFrom.get(entry)
          if(exists){
            floodFrom.set(entry, exists+1);
          } else {
            floodFrom.set(entry,1);
          } 
      });
  
      console.log("flood recieveid by ",peerId);
      console.log(floodFrom);
      
      if(floodFrom.size == args.TOTAL_PEERS){
        flags.testSuccessful = true;
        await driver.executeScript(floodCmd);
        console.log("Test successful. Exiting.", peerId)
        return;
      }
    }

    if(!flags.testSuccessful){
      driver.executeScript(
        'browserstack_executor: {"action": "setSessionStatus", "arguments": {"status":"failed", "Flood test failed : Did not get flood messages back"');
    }

  } catch (e) {
    console.log(e);
  }
}




async function runTestWithCaps (capabilities) {
  var prefs = new logging.Preferences();
  prefs.setLevel(logging.Type.BROWSER, logging.Level.ALL);

  let driver = new webdriver.Builder()
    .usingServer('http://' + BrowserstackUsername + ':' + BrowserstackAccessKey + '@hub-cloud.browserstack.com/wd/hub')
    .withCapabilities({
      ...capabilities,
      ...capabilities['browser'] && { browserName: capabilities['browser']}  // Because NodeJS language binding requires browserName to be defined
    })
    .setLoggingPrefs(prefs)
    .build();
    

  try {
    await driver.get("https://peer-test-app.dev.vdb.to/");

    // wait till node starts
    const nodeStartedElement = await driver.findElement(webdriver.By.xpath(nodeStartedXpath));
    await driver.wait(async function(){
      return await nodeStartedElement.getText().then(function (hasNodeStarted){
        return hasNodeStarted == 'true';
      });
    }, 100 * 1000);
    console.log("Node started.");

    // fetch peer id 
    const peerIdElement = await driver.findElement(webdriver.By.xpath(peerIdXpath));
    await driver.wait(async function(){
      return peerIdElement.getText().then(function (peerId){
        return peerId != '';
      });
    }, 100 * 1000);
    const peerId =  await peerIdElement.getText().then(function (peerId) {return peerId;});
    console.log("Peer id : ", peerId);

    
    // wait for sufficient connections
    const peerConnectionsElement = driver.findElement(webdriver.By.xpath(peerConnectionsXpath));
    await driver.wait(async function(){
      return await peerConnectionsElement.getText().then(function(connections){
        return parseInt(connections) >= args.MIN_REQUIRED_CONNECTIONS;
      });
    }, 100 * 1000);
    console.log("Minimum number of connections required for flood test achieved.")
    console.log("Initiating tests.", peerId)


    var flags = {
      isRetry : false,
      testSuccessful : false,
      abortTest : false
    };

    await Promise.all([
        trackPeerConnections(peerConnectionsElement, args, flags),
        floodTest(driver,peerId, args, flags),
    ]); 
        
  } catch (e) {
    await driver.executeScript(
      'browserstack_executor: {"action": "setSessionStatus", "arguments": {"status":"failed","reason": "Some elements failed to load!"}}'
    );
  }
  await driver.quit();
}
const capabilities = {
    'bstack:options' : {
        "os": "Windows",
        "osVersion": "11",
        "browserVersion": "110.0",
        "buildName" : "Peer-test-automation-build-1",
        "sessionName" : "Parallel test 1",
    },
    "browserName": "Chrome"
    }
runTestWithCaps(capabilities);
runTestWithCaps(capabilities);
runTestWithCaps(capabilities);
