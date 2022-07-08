/* eslint-disable prettier/prettier */
/* eslint-disable import/extensions */
const { ethers } = require('hardhat')
const deployer = require('../helpers/deploy')
const { assert } = require('chai')

contract('KeyBurner', () => {
  describe('tokenURI / behaviour', () => {
    let keyBurner
    let outwave
    let outwaveLock
    let outwaveAddr
    let eventHash
    const baseTokenUri = 'https://uri.com/'
    let mintedTokenId

    before(async () => {
      const { outwaveAddress, unlockAddress } = await deployer.deployUnlock('10')
      outwaveAddr = outwaveAddress
      const keyBurnerAddress = await deployer.deployKeyBurner({
        outwaveAddress,
        unlockAddress
      })
      let keyBurnerFactory = await ethers.getContractFactory('EventKeyBurner')
      keyBurner = await keyBurnerFactory.attach(keyBurnerAddress)

      let outwaveFactory = await ethers.getContractFactory('OutwaveEvent')
      outwave = await outwaveFactory.attach(outwaveAddr)
      await outwave.setBaseTokenUri(baseTokenUri)

      const tx = await outwave
        .eventCreate(
          web3.utils.padLeft(web3.utils.asciiToHex('1'), 64),
          'name',
          web3.utils.padLeft(0, 40), // address(0) 
          web3.utils.toWei('0.0001', 'ether'),
          100000,
          web3.utils.padLeft(web3.utils.asciiToHex('2'), 64)
        )
      await tx.wait()

      let receipt = await tx.wait()
      let evt = receipt.events.find((v) => v.event === 'LockRegistered')

      let OutwaveLock = await ethers.getContractFactory('PublicLock')
      outwaveLock = await OutwaveLock.attach(evt.args.lockAddress)
      eventHash = evt.args.eventId

      const [, , , keyOwner] = await ethers.getSigners()

      const txPurchase = await outwaveLock
        .purchase(
          [],
          [keyOwner.address],
          [web3.utils.padLeft(0, 40)],
          [web3.utils.padLeft(0, 40)],
          [[]],
          {
            value: web3.utils.toWei('0.0001', 'ether'),
          }
        )

      const purchaseReceipt = await txPurchase.wait()

      const purchaseEvt = purchaseReceipt.events.find((v) => v.event === 'Transfer')
      const tokenId = purchaseEvt.args.tokenId
      await outwaveLock.connect(keyOwner).approve(keyBurner.address, tokenId)

      const txBurn = await keyBurner.connect(keyOwner).burnKey(outwaveLock.address, Number(tokenId), eventHash)
      const txBurnRec = await txBurn.wait()
      const keyBurnEvent = txBurnRec.events.find((v) => v.event === 'KeyBurn')

      assert.equal(keyBurnEvent.args.lock, outwaveLock.address)
      assert.equal(keyBurnEvent.args.burnedTokenId.toString(), tokenId.toString())
      assert(keyBurnEvent.args.newTokenId)
      mintedTokenId = keyBurnEvent.args.newTokenId
    })

    it('should keyburner implement erc721 and return correct tokenuri, returning a valid name', async () => {

      let [, user1] = await ethers.getSigners()
      const erc721 = new ethers.Contract(
        keyBurner.address,
        [
          'function tokenURI(uint256 tokenId) public view returns (string memory)',
        ],
        user1
      )
      let uri = await erc721.tokenURI(mintedTokenId)
      assert.equal(
        uri.toLowerCase(),
        (baseTokenUri + outwaveLock.address + '/burned').toLowerCase()
      )
    })
  })
})
