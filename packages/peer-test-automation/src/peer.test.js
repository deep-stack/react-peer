require('dotenv').config();

import fs from 'fs';

import {trackPeerConnections, floodTest} from './utils'
import { MIN_REQUIRED_CONNECTIONS } from './constants';

const webdriver = require('selenium-webdriver');
const logging = require('selenium-webdriver').logging;  

const peerTestAppURL = "https://peer-test-app.dev.vdb.to/"

async function runTestWithCapabilities (capabilities) {
    var prefs = new logging.Preferences();
    prefs.setLevel(logging.Type.BROWSER, logging.Level.ALL);
  
    const BrowserstackUsername = process.env.BSTACK_USERNAME;
    const BrowserstackAccessKey = process.env.BSTACK_ACCESS_KEY;

    let driver = new webdriver.Builder()
        .usingServer('http://' + BrowserstackUsername + ':' + BrowserstackAccessKey + '@hub-cloud.browserstack.com/wd/hub')
        .withCapabilities({
            ...capabilities,
            ...capabilities['browser'] && { browserName: capabilities['browser']}  // Because NodeJS language binding requires browserName to be defined
        })
        .setLoggingPrefs(prefs)
        .build();
  
    try {
        await driver.get(peerTestAppURL);

        const xpaths = JSON.parse(fs.readFileSync("elements-xpaths.json"));

        // Waits till node starts
        const nodeStartedElement = await driver.findElement(webdriver.By.xpath(xpaths.nodeStartedXpath));
        await driver.wait(async function(){
            return await nodeStartedElement.getText().then(function (hasNodeStarted){
                return hasNodeStarted == 'true';
            });
        }, 100 * 1000);

        // Fetch peer id 
        const peerIdElement = await driver.findElement(webdriver.By.xpath(xpaths.peerIdXpath));
        await driver.wait(async function(){
            return peerIdElement.getText().then(function (peerId){
                return peerId != '';
            });
        }, 100 * 1000);
        const peerId =  await peerIdElement.getText().then(function (peerId) {return peerId;});
        console.log("Peer id : ", peerId);

        // Wait for sufficient connections
        // TODO: Use a better heuristic
        const peerConnectionsElement = driver.findElement(webdriver.By.xpath(xpaths.peerConnectionsXpath));
        await driver.wait(async function(){
            return await peerConnectionsElement.getText().then(function(connections){
                return parseInt(connections) >= MIN_REQUIRED_CONNECTIONS;
            });
        }, 100 * 1000);

        var flags = {
            isRetry : false,
            testSuccessful : false,
            abortTest : false
        };

        await Promise.all([
            trackPeerConnections(peerConnectionsElement, flags),
            floodTest(driver, peerId, flags),
        ]); 
            
    } catch (e) {
      await driver.executeScript(
        'browserstack_executor: {"action": "setSessionStatus", "arguments": {"status":"failed","reason": "Some elements failed to load!"}}'
      );
    }
    await driver.quit();
}
  
export { runTestWithCapabilities };
