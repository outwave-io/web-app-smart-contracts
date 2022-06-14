/* eslint-disable */
/* eslint-disable global-require */

const { task } = require('hardhat/config')
require("@tenderly/hardhat-tenderly");



task('tool:event:addErc20', 'Adds support for specific USDC token payment. if not ecr20addr is specified, USDC on mumbai is used')
  .addParam('outwaveaddr', 'the outwave facade address')
  .addOptionalParam('erc20addr', 'the ERC20 Address to add')
  .setAction(async ({ outwaveaddr, erc20addr = '0x2b8920cBdDCc3e85753423eEceCd179cb9232554' }, { ethers }) => {

    let Outwave = await ethers.getContractFactory('OutwaveEvent')
    let outwave = await Outwave.attach(outwaveaddr)
    await outwave.erc20PaymentTokenAdd(erc20addr)
    console.log('erc20 address can be used in creating lock: ' + erc20addr);
  });

task('tool:erc20:approve', 'Approve spending')
  .addParam('lockaddr', 'the address of the contract to approve spending')
  .addOptionalParam('erc20addr', 'the ERC20 Address to add')
  .addOptionalParam('amount', 'the amount to approve')
  .setAction(async ({
    lockaddr,
    erc20addr = '0x2b8920cBdDCc3e85753423eEceCd179cb9232554',
    amount = 9000000000000000
  }, { ethers }) => {

    let [user1] = await ethers.getSigners()
    const abi = [
      'function approve(address speder, uint256 amount) external returns (bool)',
      'function balanceOf(address account) external view returns (uint256)'
    ]
    let tokenContract = new ethers.Contract(erc20addr, abi, user1);

    await tokenContract.approve(lockaddr, amount)
    console.log('user balance is ' + await tokenContract.balanceOf(user1.address));
    console.log('approved max ' + amount + ' for ' + lockaddr);
  });


task('tool:event:createEvent', 'create Event and returns lock address')
  .addParam('outwaveaddr', 'the address of the outwave organization')
  .addOptionalParam('eventid', 'the eventId ')
  .addOptionalParam('lockname', 'the lock name')
  .addOptionalParam('keytokenaddr', 'token address')
  .addOptionalParam('keyprice', 'key price')
  .addOptionalParam('keyquantity', 'key quantity')
  .addOptionalParam('keyuri', 'key quantity')
  .setAction(async ({
    outwaveaddr,
    eventid = 'event1',
    lockId = 'lock1',
    lockname = 'New Outwave Lock',
    keytokenaddr = web3.utils.padLeft(0, 40), //address(0)
    keyprice = web3.utils.toWei('0.000001', 'ether'),
    keyquantity = 100000,
    keyuri = 'ipfs://QmdBAufFCb7ProgWvWaNkZmeLDdPLXRKF3ku5tpe99vpPx'
  }, { ethers }) => {


    let Outwave = await ethers.getContractFactory('OutwaveEvent')
    let outwave = await Outwave.attach(outwaveaddr)


    const eventHash = web3.utils.padLeft(web3.utils.asciiToHex(eventid), 64);
    const lockHash = web3.utils.padLeft(web3.utils.asciiToHex(lockId), 64);
    const txEv = await outwave
      .eventCreate(
        eventHash,
        lockname,
        keytokenaddr,
        keyprice,
        keyquantity,
        keyuri,
        lockHash
      )

    let evRec = await txEv.wait()
    let evtLock = evRec.events.find((v) => v.event === 'LockRegistered')
    console.log("event created. lock address is: " + evtLock.args.lockAddress)
  })

task('tool:lock:purchase', 'purchase NFT with erc20 from lockaddress')
  .addParam('lockaddr', 'the address of the outwave organization')
  .addOptionalParam('erc20', 'use erc20 purchase (bool)')
  .addOptionalParam('keydest', 'destinator of the key')
  .setAction(async ({
    lockaddr,
    erc20 = false,
    keydest
  }, { ethers }) => {

    if (keydest == null) {
      let [user1] = await ethers.getSigners()
      keydest = user1.address;
    }

    let readlock = await ethers.getContractAt('PublicLock', lockaddr)
    const keyprice = await readlock.keyPrice()

    let txr3;
    if (erc20) {
      txr3 = await readlock.purchase(
        [keyprice],
        [keydest],
        [web3.utils.padLeft(0, 40)],
        [web3.utils.padLeft(0, 40)],
        [[]]
      )
    }
    else {
      txr3 = await readlock.purchase(
        [],
        [keydest],
        [web3.utils.padLeft(0, 40)],
        [web3.utils.padLeft(0, 40)],
        [[]],
        {
          value: keyprice
        }
      )
    }


    let receipt = await txr3.wait()
    // not sure why this not works...its the same as unit test
    const evt = receipt.events.find((v) => v.event === 'Transfer')
    console.log(`Token ${evt.args.tokenId} minted and sent to ${evt.args.to}`)
    console.log(
      `Key balance of ${keydest} is ${await readlock.balanceOf(
        keydest
      )}`
    )

  })


task('tool:keyburner:burn', 'mint some keys and burn them ??')
  .addParam('keyburnaddr', 'the key burner address')
  .addParam('lockaddr', 'the public lock address')
  .addParam('tokenid', 'the key tokenid')
  .setAction(async ({ keyburnaddr, lockaddr, tokenid }, { ethers }) => {
    if (keydest == null) {
      let [user1] = await ethers.getSigners()
      keydest = user1.address;
    }

    let readlock = await ethers.getContractAt('PublicLock', lockaddr)
    const ownerAddress = await readlock.ownerOf(tokenid)


    console.log("owner is aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa ")
    console.log(ownerAddress)



    // const KeyBurner = await ethers.getContractFactory('EventKeyBurner')
    // const keyBurner = KeyBurner.attach(keyburnaddr)

    // const outwave = await ethers.getContractAt('OutwaveEvent', await keyBurner.readOutwave())
    // console.log(`outwave instantiated`)

    // await outwave.connect(lockOwner).eventSetBaseTokenURI(lockaddr, 'ipfs://QmdBAufFCb7ProgWvWaNkZmeLDdPLXRKF3ku5tpe99vpPx/')
    // console.log('set new base token uri on public lock')

    // // purchase key from lock
    // const publicLock = await ethers.getContractAt('PublicLock', lockaddr)
    // console.log(`public lock instantiated`)
    // const keyPrice = await publicLock.keyPrice()
    // // eslint-disable-next-line no-console
    // console.log(`Key price is ${keyPrice} WEI`)

    // const signers = (await ethers.getSigners()).slice(-10)

    // for (let index = 0; index < signers.length; index++) {
    //   const signer = signers[index]
    //   const signerKeyBalance = await publicLock.balanceOf(
    //     signer.address
    //   )
    //   console.log(`Key balance of ${signer.address} is ${signerKeyBalance}`)

    //   if (signerKeyBalance == 1) continue

    //   const txPurchase = await publicLock
    //     .connect(signer)
    //     .purchase(
    //       [],
    //       [signer.address],
    //       [web3.utils.padLeft(0, 40)],
    //       [web3.utils.padLeft(0, 40)],
    //       [[]],
    //       {
    //         value: keyPrice,
    //       }
    //     )

    //   const txPurRec = await txPurchase.wait()
    //   const evt = txPurRec.events.find((v) => v.event === 'Transfer')
    //   // const tokenId = evt.args.tokenId
    //   // eslint-disable-next-line no-console
    //   console.log(`Token ${evt.args.tokenId} minted and sent to ${evt.args.to}`)
    //   // eslint-disable-next-line no-console
    //   console.log(
    //     `Key balance of ${signer.address} is ${await publicLock.balanceOf(
    //       signer.address
    //     )}`
    //   )

    //   console.log('-----------------------------')
    // }

    // for (let index = 0; index < signers.length; index++) {
    //   const signer = signers[index]
    //   const tokenId = await publicLock
    //     .connect(signer)
    //     .tokenOfOwnerByIndex(signer.address, 0)

    //   // approve key trasfer from keyBurner in publickLock
    //   await publicLock.connect(signer).approve(keyBurner.address, tokenId)
    //   console.log(
    //     `One time trasfer of ERC721 '${tokenId}:${publicLock.address}' has been granted to keyBurner ${keyBurner.address}`
    //   )

    //   // burn the token
    //   const txBurn = await keyBurner.connect(signer).burnKey(publicLock.address, tokenId)
    //   const txBurnRec = await txBurn.wait()
    //   const keyBurnEvent = txBurnRec.events.find((v) => v.event === 'KeyBurn')
    //   const nftMintEvent = txBurnRec.events.find((v) => v.event === 'Transfer' && v.args.from == web3.utils.padLeft(0, 40))

    //   console.log(
    //     `Key '${keyBurnEvent.args.tokenId}:${keyBurnEvent.args.lock}' has been burned by keyBurner on behalf of user ${keyBurnEvent.args.from}`
    //   )
    //   console.log(
    //     `User received the OPA NFT #${nftMintEvent.args.tokenId} in return, it's tokenUri is ${await keyBurner.tokenURI(nftMintEvent.args.tokenId)}`
    //   )

    //   const originalKey = await keyBurner.readOriginalKey(nftMintEvent.args.tokenId)
    //   console.log('Original Key info:')
    //   console.log(originalKey)

    //   console.log('-----------------------------')
    // }
  })
/* eslint-enable */
