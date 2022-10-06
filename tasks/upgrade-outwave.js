/* eslint-disable */
/* eslint-disable global-require */

const { task } = require('hardhat/config')
require("@tenderly/hardhat-tenderly");

task('outwave:upgrade', 'deploys unlock infrastructure')
  .addOptionalParam('verify', 'verify with hardhat-tenderly')
  .addOptionalParam('paymentAddress', 'the address where fees will be sent')
  .addParam('outwaveAddress', 'actual outwave address')
  .addParam('unlockAddress', 'the unlock factory address')
  .addOptionalParam('basetokenuri', 'sets the baseTokenUri for nfts')
  .setAction(async ({ 
    verify = false,
    paymentAddress =  "0xB2B2be136eB0b137Fa58F70E24E1A0AC90bAD877",
    outwaveAddress,
    unlockAddress,
    basetokenuri
  }, { ethers }) => {

    console.log("!!! DO NOT USE THIS IN PRODUCTION YET: PARAMS HARDCODED!");
    console.log("!!! Outwave payments are set to: " + paymentAddress);

    const outwaveUpgrader = require('../scripts/upgrades/outwave.js')
    outwaveAddress = await outwaveUpgrader({ outwaveAddress, unlockAddress, paymentAddress, basetokenuri })

    console.log("- outwave org upgraded at: " + outwaveAddress);

    // if(basetokenuri){
    //   await outwave.setBaseTokenUri(basetokenuri);
    //   console.log("- eventmanager:setBaseTokenUri has been set to: " + basetokenuri);
    // }

    // const keyBurnerDeployer = require('../scripts/upgrades/eventKeyBurner')
    // var eventKeyburnerAddress = await keyBurnerDeployer({
    //   outwaveAddress: outwaveAddress,
    //   unlockAddress: unlockAddress
    // })
    // console.log("- event keyburner upgraded at: " + eventKeyburnerAddress);

    if (verify) {
      console.log(" * verify with hardhat-tenderly..");

      await hre.tenderly.persistArtifacts({
        name: "OutwaveEvent",
        address: outwaveAddress,
      })

      await hre.tenderly.verify({
        name: "OutwaveEvent",
        address: outwaveAddress,
      })

      await hre.tenderly.push({
        name: "OutwaveEvent",
        address: outwaveAddress,
      })


      console.log(" * OutwaveEvent, loadedin tenderly");

      // await hre.tenderly.persistArtifacts({
      //   name: "EventKeyBurner",
      //   address: eventKeyburnerAddress,
      // })

      // await hre.tenderly.verify({
      //   name: "EventKeyBurner",
      //   address: eventKeyburnerAddress,
      // })

      await hre.tenderly.push({
        name: "EventKeyBurner",
        address: outwaveAddress,
      })

      console.log(" * EventKeyBurner, loadedin tenderly");

      await hre.tenderly.persistArtifacts({
        name: "Unlock",
        address: unlockAddress,
      })

      await hre.tenderly.verify({
        name: "Unlock",
        address: unlockAddress,
      })

      await hre.tenderly.push({
        name: "Unlock",
        address: outwaveAddress,
      })

      console.log(" * Unlock, loaded in tenderly");
      console.log(" ...done! visit https://dashboard.tenderly.co/");
    }
   	console.log("[onchain] To verify on blockchain: yarn verify " + outwaveAddress + " " + unlockAddress + " --network XXXXXXXXXXXXX")
  });

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
