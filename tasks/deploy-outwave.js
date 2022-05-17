/* eslint-disable */
/* eslint-disable global-require */

const { task } = require('hardhat/config')

task('outwave:deploy', 'deploys unlock infrastructure')
  .setAction(async ({ }, { ethers }) => {

    let unlockVersion = "10";
    let unlockAddress = await run('deploy:unlock')
    let publicLockAddress = await run('deploy:template')
    let receivePaymentAddress = "0xB2B2be136eB0b137Fa58F70E24E1A0AC90bAD877";
      // set lock template
    await run('set:template', {
      publicLockAddress,
      unlockAddress,
      unlockVersion,
    });

    let Outwave = await ethers.getContractFactory('OutwaveEvent')
    let outwave = await Outwave.deploy(unlockAddress, receivePaymentAddress);

    console.log("- unlock deployed: " +  unlockAddress);
    console.log("- publiclock template deployed: " +  publicLockAddress);
    console.log("- outwave org deployed: " + outwave.address);
    console.log("To verify on blockchain: yarn verify " + outwave.address + " --network mumbai  "+ unlockAddress + " " + receivePaymentAddress + " --network XXXXXXXXXXXXX")

});


task('outwave:deploy:createlock', 'create lock and returns address')
 // .addParam('outwaveaddr', 'the address of the outwave organization')
  .addOptionalParam('lockname', 'the lock name')
  .setAction(async ({  lockname = 'New Outwave Lock' }, { ethers }) => {

    const [owner, addr1, addr2, addr3] = await ethers.getSigners();

    console.log("###########")
    console.log("owner balance: " + await owner.getBalance());
    console.log("owner addr1: " + await addr1.getBalance());
    console.log("owner addr2: " + await addr2.getBalance());
    console.log("owner addr3 - outwave : " + await addr3.getBalance());
    console.log("###########")


    let unlockVersion = "10";
    let unlockAddress = await run('deploy:unlock')
    let publicLockAddress = await run('deploy:template')
      // set lock template
    await run('set:template', {
      publicLockAddress,
      unlockAddress,
      unlockVersion,
    });

    // let OutwaveHook =  await ethers.getContractFactory('OutwaveHookPayment');
    // let outwavehook = await OutwaveHook.deploy(addr3.address);

    let Outwave = await ethers.getContractFactory('OutwaveEvent')
    let outwave = await Outwave.deploy(unlockAddress, addr3.address);

  
    console.log("- unlock deployed: " +  unlockAddress);
    console.log("- publiclock template deployed: " +  publicLockAddress);
    console.log("- outwave org deployed: " + outwave.address);
    // console.log("- outwave hook deployed: " +  outwavehook.address);


    // var orgTx = await outwave.createOrganization("0x63616e6469646174653100000000000000000000000000000000000000000000");
    // const orgReceipt = await orgTx.wait()
    // let evtOrg = orgReceipt.events.find((v) => v.event === 'OrganizationCreated')
    // console.log("- new outwave organizaton published at: " + evtOrg.args.newOrganizationAddress);

   // console.log("organization created at: "+ addreOrg);
    
    // const tx = await outwave.createLock(
    //   0 * 60 * 24 * 30, // expirationDuration: 30 days
    //   web3.utils.padLeft(0, 40), // token address
    //   web3.utils.toWei('0.01', 'ether'), // keyPrice: in wei
    //   1000, // max num od keys
    //   lockname
    // )

    console.log("create eve");

    var param1 = 5;
    var param2 = [web3.utils.toWei('0.01', 'ether')];
    var param3 = [100000];
    var param4 = [1];

    
    //const tx = await outwave.eventCreate(param1, param2, param3);
    const tx = await outwave.eventCreate(1,["name"], [web3.utils.toWei('0.01', 'ether')], [100000], [1]);
    const receipt = await tx.wait()
    console.log(receipt)
    let evt = receipt.events.find((v) => v.event === 'LockRegistered')
    console.log(evt)

    let newLockAddress = evt.args.lockAddress;
    console.log("- new public lock published at: " + newLockAddress);

    // we have lock and lets buy tickets with a different account 

    let PublicLock = await ethers.getContractFactory('PublicLock');
    let publiclock = await PublicLock.attach(newLockAddress);

    console.log("####### purchase from " + addr1.address);

    const txpurchase = await publiclock.connect(addr1).purchase(
      [],
      [addr1.address],
      [web3.utils.padLeft(0, 40)],
      [web3.utils.padLeft(0, 40)],
      [[]],
      {
        value: web3.utils.toWei('0.01', 'ether'),
      }
    );
    console.log("t"); 

    const txpurrec = await txpurchase.wait();
    console.log(txpurrec); 

    let evt2 = txpurrec.events.find((v) => v.event === 'Transfer')
    console.log("Transfer made from " + evt2.args.from); 
    console.log("Transfer made to " + evt2.args.to); 

    console.log("###########")
    console.log("owner balance: " + await owner.getBalance());
    console.log("owner addr1: " + await addr1.getBalance());
    console.log("owner addr2: " + await addr2.getBalance());
    console.log("owner addr3 - outwave : " + await addr3.getBalance());
    console.log("###########")


  })

task('outwave:call', 'create lock and returns address').setAction(
  async () => {
    console.log('wip')
  }
)


/* eslint-enable */
