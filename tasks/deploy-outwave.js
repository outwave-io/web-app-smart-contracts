/* eslint-disable */
/* eslint-disable global-require */

const { task } = require('hardhat/config')
require("@tenderly/hardhat-tenderly");

task('outwave:deploy', 'deploys unlock infrastructure')
  .addOptionalParam('verify', 'verify with hardhat-tenderly')
  .setAction(async ({ verify = false  }, { ethers }) => {
    let receivePaymentAddress = "0xB2B2be136eB0b137Fa58F70E24E1A0AC90bAD877";
    console.log("!!! DO NOT USE THIS IN PRODUCTION YET: PARAMS HARDCODED!");
    console.log("!!! Outwave payments are set to: " + receivePaymentAddress);

    let unlockVersion = "10";
    let unlockAddress = await run('deploy:unlock')
    let publicLockAddress = await run('deploy:template')
    
    // set lock template
    await run('set:template', {
      publicLockAddress,
      unlockAddress,
      unlockVersion,
    });

    let Outwave = await ethers.getContractFactory('OutwaveEvent')
    let outwave = await Outwave.deploy(unlockAddress, receivePaymentAddress);

    console.log("- unlock deployed: " + unlockAddress);
    console.log("- publiclock template deployed: " + publicLockAddress);
    console.log("- outwave org deployed: " + outwave.address);

    const keyBurnerDeployer = require('../scripts/deployments/eventKeyBurner')
    var eventKeyburnerAddress = await keyBurnerDeployer({
      outwaveAddress: outwave.address,
      unlockAddress: unlockAddress
    })
    console.log("- event keyburner published at: " + eventKeyburnerAddress);

    if(verify){
      console.log(" * verify with hardhat-tenderly..");

    await hre.tenderly.persistArtifacts({
        name: "OutwaveEvent",
        address: outwave.address,
    })

    await hre.tenderly.verify({
      name: "OutwaveEvent",
      address: outwave.address,
    })

    console.log(" * OutwaveEvent, loadedin tenderly");

    await hre.tenderly.persistArtifacts({
      name: "EventKeyBurner",
      address: eventKeyburnerAddress,
    })

    await hre.tenderly.verify({
      name: "EventKeyBurner",
      address: eventKeyburnerAddress,
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
    console.log(" * Unlock, loadedin tenderly");

    console.log(" ...done! visit https://dashboard.tenderly.co/");
    }

    console.log("[onchain] To verify OutwaveEvent on blockchain: yarn verify " + outwave.address + " " + unlockAddress + " " + receivePaymentAddress + " --network XXXXXXXXXXXXX")
    console.log("[onchain] To verify EventKeyBurner org on blockchain: yarn verify " + eventKeyburnerAddress + " " + outwave.address + " " + unlockAddress + " --network XXXXXXXXXXXXX")
    // console.log("[tenderly] To verify on tenderly:")
    // console.log("--- yarn hardhat tenderly:push OutwaveEvent=" + outwave.address + " Unlock=" + unlockAddress + " EventKeyBurner=" + addressResult + " --network XXXXXXXXXXXXX")
    // console.log("--- yarn hardhat tenderly:verify OutwaveEvent=" + outwave.address + " Unlock=" + unlockAddress + " EventKeyBurner=" + addressResult + " --network XXXXXXXXXXXXX")
 
  });



  task('outwave:deploy:keyburner', 'deploys keyburner')
  .addParam('outwaveaddr', 'the outwave facade address')
  .addParam('unlockaddr', 'the unlock factory address')
  .setAction(async ({ outwaveaddr, unlockaddr }, { run }) => {
    // eslint-disable-next-line global-require
    const keyBurnerDeployer = require('../scripts/deployments/eventKeyBurner')
    var addressResult = await keyBurnerDeployer({
      outwaveAddress: outwaveaddr,
      unlockAddress: unlockaddr
    })
    console.log("- event keyburner published at: " + addressResult);

    await hre.tenderly.persistArtifacts({
      name: "EventKeyBurner",
      address: outwave.address,
    })

    await hre.tenderly.verify({
      name: "EventKeyBurner",
      address: outwave.address,
    })

  })








/* eslint-enable */
