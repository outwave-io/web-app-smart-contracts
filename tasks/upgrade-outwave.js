/* eslint-disable */
/* eslint-disable global-require */

const { task } = require('hardhat/config')
require("@tenderly/hardhat-tenderly");

task('outwave:upgrade:keyburner', 'upgrades keyburner')
  .addParam('keyburneraddr', 'the outwave key burner address')
  .addParam('outwaveaddr', 'the outwave facade address')
  .addParam('unlockaddr', 'the unlock factory address')
  .addOptionalParam('verify', 'verify with hardhat-tenderly')
  .setAction(async ({ keyburneraddr, outwaveaddr, unlockaddr, verify }, { run }) => {
    // eslint-disable-next-line global-require
    const keyBurnerUpgrader = require('../scripts/upgrades/eventKeyBurner')
    var addressResult = await keyBurnerUpgrader({
      keyburnerAddress: keyburneraddr,
      outwaveAddress: outwaveaddr,
      unlockAddress: unlockaddr
    })
    console.log("- event keyburner upgraded at: " + addressResult);

    if (verify) {
      console.log(" * verify with hardhat-tenderly..");
      await hre.tenderly.persistArtifacts({
        name: "EventKeyBurner",
        address: outwave.address,
      })

      await hre.tenderly.verify({
        name: "EventKeyBurner",
        address: outwave.address,
      })
    }

  })








/* eslint-enable */
