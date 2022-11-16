/* eslint-disable */
/* eslint-disable global-require */

const { task } = require('hardhat/config')
require('@tenderly/hardhat-tenderly');

task('outwave:deploy', 'deploys outwave infrastructure')
  .addOptionalParam('verify', 'verify with hardhat-tenderly')
  .addOptionalParam('paymentAddress', 'the address where fees will be sent')
  .setAction(async ({ 
    verify = 'false',
    paymentAddress =  '0xB2B2be136eB0b137Fa58F70E24E1A0AC90bAD877'
  }) => {
    console.log('!!! DO NOT USE THIS IN PRODUCTION YET: PARAMS HARDCODED!');
    console.log(`!!! Outwave payments are set to: ${paymentAddress}`);

    // deploy unlock factory and template
    const unlockAddress = await run('outwave:deploy:unlock', { verify });

    const publicLockAddress = await run('outwave:deploy:template', { verify });
    
    // set the template to factory
    await run('outwave:set:template', { publicLockAddress, unlockAddress });

    // deploy key burner (NOTE: for some reason calling the task doesn't work)
    // eslint-disable-next-line global-require
    const keyBurnerDeployer = require('../scripts/deployments/keyBurner')
    const keyBurnerAddress = await keyBurnerDeployer({
      unlockAddress: unlockAddress
    })
    console.log(`- Key Burner published at: ${keyBurnerAddress}`);

    if (verify.toLowerCase() === 'true') {
      console.log(' * verify with hardhat-tenderly');
      await hre.tenderly.persistArtifacts({
        name: 'OutwaveKeyBurner',
        address: keyBurnerAddress,
      })
    }

   	console.log(`[onchain] To verify on blockchain: ` +
      `yarn verify ${unlockAddress} ${keyBurnerAddress} --network SOME_NETWORK`)
  });


task('outwave:deploy:template', 'deploys outwave public lock')
  .addOptionalParam('verify', 'verify with hardhat-tenderly')
  .setAction (async ({
    verify = 'false'
  }) => {
  // eslint-disable-next-line global-require
  const templateDeployer = require('../scripts/deployments/template')
  const templateAddress = await templateDeployer()
  console.log(`- Outwave Public Lock published at: ${templateAddress}`);

  if (verify.toLowerCase() === 'true') {
    console.log(' * verify with hardhat-tenderly');
    await hre.tenderly.persistArtifacts({
      name: 'OutwavePublicLock',
      address: templateAddress,
    })
    }    
  return templateAddress
  })

task('outwave:deploy:unlock', 'deploys outwave unlock factory')
  .addOptionalParam('verify', 'verify with hardhat-tenderly')
  .setAction (async ({
    verify = 'false'
  }) => {
  // eslint-disable-next-line global-require
  const unlockDeployer = require('../scripts/deployments/outwaveUnlock')
  const unlockAddress = await unlockDeployer()
    console.log(`- Outwave Unlock Factory published at: ${unlockAddress}`);

  if (verify.toLowerCase() === 'true') {
    console.log(' * verify with hardhat-tenderly');
    await hre.tenderly.persistArtifacts({
      name: 'OutwaveUnlock',
      address: unlockAddress,
    })
    }    
  return unlockAddress
  })

task('outwave:deploy:keyburner', 'deploys key burner')
  .addParam('unlockaddr', 'the outwave unlock factory address')
  .addOptionalParam('verify', 'verify with hardhat-tenderly')
  .setAction(async ({
    unlockaddr,
    verify = 'false' }) => {
    // eslint-disable-next-line global-require
    const keyBurnerDeployer = require('../scripts/deployments/keyBurner')
    const keyBurnerAddress = await keyBurnerDeployer({
      unlockAddress: unlockaddr
    })
    console.log(`- Key Burner published at: ${keyBurnerAddress}`);

    if (verify.toLowerCase() === 'true') {
      console.log(' * verify with hardhat-tenderly');
      await hre.tenderly.persistArtifacts({
        name: 'OutwaveKeyBurner',
        address: keyBurnerAddress,
      })
    }
    return keyBurnerAddress
  })

/* eslint-enable */
