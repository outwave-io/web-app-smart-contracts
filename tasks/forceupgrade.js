/* eslint-disable */
/* eslint-disable global-require */

const { task } = require('hardhat/config')

task('outwave:forceupgrade', 'forcely upgrades outwave')
  .addParam('outwaveAddress', 'actual outwave address')
  .setAction(async ({
    outwaveAddress
  }, { ethers }) => {

    const outwaveForceUpgrader = require('../scripts/forceupgrades/outwave.js')
    const resultAddr = await outwaveForceUpgrader({ outwaveAddress })

    console.log("- outwave forcely upgraded at: " + resultAddr);
});

task('outwave:forceupgrade:keyburner', 'forcely upgrades key burner')
.addParam('keyburnerAddress', 'the outwave key burner address')
  .setAction(async ({
    keyburnerAddress
  }, { ethers }) => {

    const keyburnerForceUpgrader = require('../scripts/forceupgrades/eventKeyBurner.js')
    const resultAddr = await keyburnerForceUpgrader({ keyburnerAddress })

    console.log("- key burner forcely upgraded at: " + resultAddr);
});

/* eslint-enable */
