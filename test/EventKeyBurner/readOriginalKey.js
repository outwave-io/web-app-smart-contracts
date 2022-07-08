/* eslint-disable prettier/prettier */
/* eslint-disable import/extensions */
const { ethers } = require('hardhat')
const deployer = require('../helpers/deploy')

const { assert } = require('chai')

contract('KeyBurner', () => {
  describe('read original key / behaviour', () => {
    let keyBurner
    let outwave
    let outwaveLock
    let outwaveAddr
    let eventHash
    const baseTokenUri = 'https://uri.com/'

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
    })

    it('should be possible to read OriginalKey for a given tokenId by anyone', async () => {
      const [, , , keyOwner, notKeyOwner] = await ethers.getSigners()

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

      const receipt = await txPurchase.wait()

      const evt = receipt.events.find((v) => v.event === 'Transfer')
      const keyId = evt.args.tokenId
      await outwaveLock.connect(keyOwner).approve(keyBurner.address, keyId)

      const txBurn = await keyBurner.connect(keyOwner).burnKey(outwaveLock.address, Number(keyId), eventHash)
      const txBurnRec = await txBurn.wait()
      const keyBurnEvent = txBurnRec.events.find((v) => v.event === 'KeyBurn')

      const originalKey = await keyBurner.connect(notKeyOwner).readOriginalKey(keyBurnEvent.args.newTokenId)

      assert.equal(originalKey.keyId._hex, keyId._hex)
      assert.equal(originalKey.lockAddress, outwaveLock.address)
    })
  })
})
