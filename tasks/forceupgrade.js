/* eslint-disable */
/* eslint-disable global-require */

const { task } = require('hardhat/config')

task('outwave:forceupgrade', 'forcely upgrades outwave')
  .addParam('outwaveAddress', 'actual outwave address')
  .setAction(async ({
    outwaveAddress
  }, { ethers }) => {

    const outwaveForceUpgrader = require('../scripts/forceupgrades/outwave.js')
    var outwaveAddress = await outwaveForceUpgrader({ outwaveAddress })

    console.log("- outwave force upgraded at: " + outwaveAddress);
});

/* eslint-enable */
