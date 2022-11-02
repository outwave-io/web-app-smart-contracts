/* eslint-disable */
/* eslint-disable global-require */

const { task } = require('hardhat/config')
require("@tenderly/hardhat-tenderly");

task('outwave:deploy:outwaveevent', 'deploys unlock infrastructure')
  .addParam('unlockAddress', 'the unlock factory address')
  .addParam('paymentAddress', 'the address where fees will be sent')
  .setAction(async ({ 
    unlockAddress,
    paymentAddress
  }, { ethers }) => { 

    let [owner] = await ethers.getSigners()
    console.log("- deploying from: " + owner.address)
    console.log("- param unlockaddress: "+ unlockAddress)
    console.log("- param paymentaddress: "+ paymentAddress)

    const outwaveDeployer = require('../scripts/deployments/outwave.js')
    var outwaveAddress = await outwaveDeployer({ unlockAddress, paymentAddress})
    console.log("- outwave event manager deployed: " + outwaveAddress);

   });



task('outwave:deploy', 'deploys unlock infrastructure')
  .addOptionalParam('verify', 'verify with hardhat-tenderly')
  .addOptionalParam('paymentAddress', 'the address where fees will be sent')
  .addOptionalParam('basetokenuri', 'sets the baseTokenUri for nfts')
  .setAction(async ({ 
    verify = false,
    paymentAddress =  "0xD7eFf125a429de3f38334bD863520789e5818017",
    basetokenuri
  }, { ethers }) => {

    console.log("!!! DO NOT USE THIS IN PRODUCTION YET: PARAMS HARDCODED!");
    console.log("!!! Outwave payments are set to: " + paymentAddress);
    
    let [owner] = await ethers.getSigners()
    console.log("- deploying from: " + owner.address)
    

    let unlockVersion = "10";
    let unlockAddress = await run('deploy:unlock')
    let publicLockAddress = await run('deploy:template')

    // set lock template
    await run('set:template', {
      publicLockAddress,
      unlockAddress,
      unlockVersion,
    });

    console.log("- unlock deployed: " + unlockAddress);
    console.log("- publiclock template deployed: " + publicLockAddress);

    const outwaveDeployer = require('../scripts/deployments/outwave.js')
    var outwaveAddress = await outwaveDeployer({ unlockAddress, paymentAddress })

    console.log("- outwave event manager deployed: " + outwaveAddress);

    if(basetokenuri){
      await outwave.setBaseTokenUri(basetokenuri);
      console.log("- eventmanager:setBaseTokenUri has been set to: " + basetokenuri);
    }

    const keyBurnerDeployer = require('../scripts/deployments/eventKeyBurner')
    var eventKeyburnerAddress = await keyBurnerDeployer({
      outwaveAddress: outwaveAddress,
      unlockAddress: unlockAddress
    })
    console.log("- event keyburner published at: " + eventKeyburnerAddress);

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

      await hre.tenderly.persistArtifacts({
        name: "EventKeyBurner",
        address: eventKeyburnerAddress,
      })

      await hre.tenderly.verify({
        name: "EventKeyBurner",
        address: eventKeyburnerAddress,
      })

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

      console.log(" * Unlock, loadedin tenderly");
      console.log(" ...done! visit https://dashboard.tenderly.co/");
    }
   	console.log("[onchain] To verify on blockchain: yarn verify " + outwaveAddress + " " + unlockAddress + " " + eventKeyburnerAddress + " --network XXXXXXXXXXXXX")
  });



task('outwave:deploy:keyburner', 'deploys keyburner')
  .addParam('outwaveaddr', 'the outwave facade address')
  .addParam('unlockaddr', 'the unlock factory address')
  .addOptionalParam('verify', 'verify with hardhat-tenderly')
  .setAction(async ({ outwaveaddr, unlockaddr, verify }, { run }) => {
    // eslint-disable-next-line global-require
    const keyBurnerDeployer = require('../scripts/deployments/eventKeyBurner')
    var addressResult = await keyBurnerDeployer({
      outwaveAddress: outwaveaddr,
      unlockAddress: unlockaddr
    })
    console.log("- event keyburner published at: " + addressResult);

    if (verify) {
      console.log(" * verify with hardhat-tenderly..");
      await hre.tenderly.persistArtifacts({
        name: "EventKeyBurner",
        address: outwaveAddress,
      })

      await hre.tenderly.verify({
        name: "EventKeyBurner",
        address: outwaveAddress,
      })
    }

  })








/* eslint-enable */
