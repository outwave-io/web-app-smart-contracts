/* eslint-disable */
/* eslint-disable global-require */

const { task } = require('hardhat/config')
require('@tenderly/hardhat-tenderly');

task('outwave:createLock', 'deploys outwave infrastructure')
  .addOptionalParam('verify', 'verify with hardhat-tenderly')
  .addOptionalParam('paymentAddress', 'the address where fees will be sent')
  .setAction(async ({
    verify = 'false',
    paymentAddress = '0xB2B2be136eB0b137Fa58F70E24E1A0AC90bAD877'
  }) => {
    // console.log('!!! DO NOT USE THIS IN PRODUCTION YET: PARAMS HARDCODED!');
    // console.log(`!!! Outwave payments are set to: ${paymentAddress}`);

    // // deploy unlock factory and template
    // const unlockAddress = await run('outwave:deploy:unlock', { verify });

    // const publicLockAddress = await run('outwave:deploy:template', { verify });

    // // set the template to factory
    // await run('outwave:set:template', { publicLockAddress, unlockAddress });

    // // deploy key burner (NOTE: for some reason calling the task doesn't work)
    // // eslint-disable-next-line global-require
    // const keyBurnerDeployer = require('../scripts/deployments/keyBurner')
    // const keyBurnerAddress = await keyBurnerDeployer({
    //   unlockAddress: unlockAddress
    // })
    // console.log(`- Key Burner published at: ${keyBurnerAddress}`);


    let outwaveUnlock = await ethers.getContractFactory('OutwaveUnlock')
    unlock = await outwaveUnlock.attach("0xb382cA6080c6bB8B9Ca85cb460FAA387f87768A4")

      ;[addr0, addr1] = await ethers.getSigners()
    // const tx = await unlock.connect(addr1).createLock(
    //   0,
    //   "0x0000000000000000000000000000000000000000",
    //   25000000000000000n,
    //   200,
    //   "Fairy Attack NFT",
    //   "0x2d154b8a7c043015bea6e474",
    //   "0xB2B2be136eB0b137Fa58F70E24E1A0AC90bAD877",
    //   200,
    //   1
    // )
    const tx = await unlock.connect(addr0).createLock(
        0,
        ethers.constants.AddressZero,
        0,
        0,
        ""
        // "0x000000000000000000000000",
        // ethers.constants.AddressZero,
        // 0,
        // 0
      )
    let receipt = await tx.wait()
  });



/* eslint-enable */
