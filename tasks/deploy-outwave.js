/* eslint-disable */
/* eslint-disable global-require */

const { task } = require('hardhat/config')

task('outwave:deploy', 'deploys unlock infrastructure')
  .setAction(async ({ }, { ethers }) => {
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
    var addressResult = await keyBurnerDeployer({
      outwaveAddress: outwave.address,
      unlockAddress: unlockAddress
    })
    console.log("- event keyburner published at: " + addressResult);
    console.log("To verify on blockchain: yarn verify " + outwave.address + " " + unlockAddress + " " + addressResult + " --network XXXXXXXXXXXXX")

  });

task('outwave:deploy:createlock', 'create lock and returns address')
  // .addParam('outwaveaddr', 'the address of the outwave organization')
  .addOptionalParam('lockname', 'the lock name')
  .setAction(async ({ lockname = 'New Outwave Lock' }, { ethers }) => {

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


    console.log("- unlock deployed: " + unlockAddress);
    console.log("- publiclock template deployed: " + publicLockAddress);
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

    console.log("create event");

    var param1 = 5;
    var param2 = [web3.utils.toWei('0.01', 'ether')];
    var param3 = [100000];
    var param4 = [1];

    const tx = await outwave.eventCreate(
      web3.utils.padLeft(web3.utils.asciiToHex("1"), 64),
      ["name"],
      [web3.utils.toWei('0.01', 'ether')],
      [100000],
      [1],
      ["ipfs://QmdBAufFCb7ProgWvWaNkZmeLDdPLXRKF3ku5tpe99vpPx"]);
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

    console.log("##### SUMMARY #####")
    console.log("unlock deployed at: " + unlockAddress);
    console.log("outwave org deployed at: " + outwave.address);
    console.log("public lock deployed at: " + newLockAddress);
  })

task('outwave:call', 'create lock and returns address').setAction(
  async () => {
    console.log('wip')
  }
)

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

  })

task('outwave:call:keyburner', 'mint some keys and burn them ??')
  .addParam('keyburnaddr', 'the key burner address')
  .addParam('lockaddr', 'the public lock address')
  .setAction(async ({ keyburnaddr, lockaddr }, { ethers }) => {
    const [lockOwner, addr1, addr2, outwaveOwner] = await ethers.getSigners();

    const KeyBurner = await ethers.getContractFactory('EventKeyBurner')
    const keyBurner = KeyBurner.attach(keyburnaddr)

    const outwave = await ethers.getContractAt('OutwaveEvent', await keyBurner.readOutwave())
    console.log(`outwave instantiated`)

    await outwave.connect(lockOwner).eventSetBaseTokenURI(lockaddr, 'ipfs://QmdBAufFCb7ProgWvWaNkZmeLDdPLXRKF3ku5tpe99vpPx/')
    console.log('set new base token uri on public lock')

    // purchase key from lock
    const publicLock = await ethers.getContractAt('PublicLock', lockaddr)
    console.log(`public lock instantiated`)
    const keyPrice = await publicLock.keyPrice()
    // eslint-disable-next-line no-console
    console.log(`Key price is ${keyPrice} WEI`)

    const signers = (await ethers.getSigners()).slice(-10)

    for (let index = 0; index < signers.length; index++) {
      const signer = signers[index]
      const signerKeyBalance = await publicLock.balanceOf(
        signer.address
      )
      console.log(`Key balance of ${signer.address} is ${signerKeyBalance}`)

      if (signerKeyBalance == 1) continue

      const txPurchase = await publicLock
        .connect(signer)
        .purchase(
          [],
          [signer.address],
          [web3.utils.padLeft(0, 40)],
          [web3.utils.padLeft(0, 40)],
          [[]],
          {
            value: keyPrice,
          }
        )

      const txPurRec = await txPurchase.wait()
      const evt = txPurRec.events.find((v) => v.event === 'Transfer')
      // const tokenId = evt.args.tokenId
      // eslint-disable-next-line no-console
      console.log(`Token ${evt.args.tokenId} minted and sent to ${evt.args.to}`)
      // eslint-disable-next-line no-console
      console.log(
        `Key balance of ${signer.address} is ${await publicLock.balanceOf(
          signer.address
        )}`
      )

      console.log('-----------------------------')
    }

    for (let index = 0; index < signers.length; index++) {
      const signer = signers[index]
      const tokenId = await publicLock
        .connect(signer)
        .tokenOfOwnerByIndex(signer.address, 0)

      // approve key trasfer from keyBurner in publickLock
      await publicLock.connect(signer).approve(keyBurner.address, tokenId)
      console.log(
        `One time trasfer of ERC721 '${tokenId}:${publicLock.address}' has been granted to keyBurner ${keyBurner.address}`
      )

      // burn the token
      const txBurn = await keyBurner.connect(signer).burnKey(publicLock.address, tokenId)
      const txBurnRec = await txBurn.wait()
      const keyBurnEvent = txBurnRec.events.find((v) => v.event === 'KeyBurn')
      const nftMintEvent = txBurnRec.events.find((v) => v.event === 'Transfer' && v.args.from == web3.utils.padLeft(0, 40))

      console.log(
        `Key '${keyBurnEvent.args.tokenId}:${keyBurnEvent.args.lock}' has been burned by keyBurner on behalf of user ${keyBurnEvent.args.from}`
      )
      console.log(
        `User received the OPA NFT #${nftMintEvent.args.tokenId} in return, it's tokenUri is ${await keyBurner.tokenURI(nftMintEvent.args.tokenId)}`
      )

      const originalKey = await keyBurner.readOriginalKey(nftMintEvent.args.tokenId)
      console.log('Original Key info:')
      console.log(originalKey)

      console.log('-----------------------------')
    }
  })

task('outwave:call:purchasekeyfor', 'buy a key for the specified address')
  .addParam('keyburnaddr', 'the key burner address')
  .addParam('lockaddr', 'the public lock address')
  .addParam('recipientaddr', 'the recipient that will receive the key')
  .setAction(async ({ keyburnaddr, lockaddr, recipientaddr }, { ethers }) => {
    const [signer] = await ethers.getSigners();

    // const KeyBurner = await ethers.getContractFactory('EventKeyBurner')
    // const keyBurner = KeyBurner.attach(keyburnaddr)

    // purchase key from lock
    const publicLock = await ethers.getContractAt('PublicLock', lockaddr)
    console.log(`public lock instantiated`)
    const keyPrice = await publicLock.keyPrice()
    // eslint-disable-next-line no-console
    console.log(`Key price is ${keyPrice} WEI`)

    const txPurchase = await publicLock
      .connect(signer)
      .purchase(
        [],
        [recipientaddr],
        [web3.utils.padLeft(0, 40)],
        [web3.utils.padLeft(0, 40)],
        [[]],
        {
          value: keyPrice,
        }
      )

    const txPurRec = await txPurchase.wait()
    const evt = txPurRec.events.find((v) => v.event === 'Transfer')
    // const tokenId = evt.args.tokenId
    // eslint-disable-next-line no-console
    console.log(`Token ${evt.args.tokenId} minted and sent to ${evt.args.to}`)
    // eslint-disable-next-line no-console
    console.log(
      `Key balance of ${recipientaddr} is ${await publicLock.balanceOf(
        recipientaddr
      )}`
    )

    console.log('-----------------------------')
  })

/* eslint-enable */
