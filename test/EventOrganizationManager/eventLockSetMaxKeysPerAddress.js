const { assert } = require('chai')
const { ethers } = require('hardhat')
const { reverts } = require('truffle-assertions')
const keyPrice = web3.utils.toWei('0.01', 'ether')

/*
 NOTE: to test correctly the usage of the contract, users shall interract via interface IEventOrganizationManagerMixin
 and avoid accessing via concrete implementation.

 Tests shall use:
  - outwave = await ethers.getContractAt("IEventOrganizationManagerMixin", addresses.outwaveAddress);
 Tests shall NOT use
  -  let outwaveFactory = await ethers.getContractFactory('OutwaveEvent')
     outwave = await outwaveFactory.attach(addresses.outwaveAddress)

 Concrete implementation is allowed only for setting up the contract in the before() event.
*/

contract('Organization Event Manager', () => {
  describe('set max keys per address / behaviour ', () => {
    let outwave
    let lockAddress
    let user1
    let publiclock
    let randomWallet = ethers.Wallet.createRandom()

    before(async () => {
      let addresses = await require('../helpers/deploy').deployUnlock('10')
      let outwaveFactory = await ethers.getContractFactory('OutwaveEvent')
      let outwaveManager = await outwaveFactory.attach(addresses.outwaveAddress)
      ;[, , user1] = await ethers.getSigners()
      await outwaveManager.updateOutwavePaymentAddress(randomWallet.address) // set dao payment address

      outwave = await ethers.getContractAt(
        'IEventOrganizationManagerMixin',
        addresses.outwaveAddress
      )
      const tx = await outwave.connect(user1).eventCreate(
        web3.utils.padLeft(web3.utils.asciiToHex('1'), 64),
        'name',
        web3.utils.padLeft(0, 40), // address(0),
        keyPrice,
        10, // num keys
        1,
        web3.utils.padLeft(web3.utils.asciiToHex('2'), 64)
      )
      let receipt = await tx.wait()
      // verify events
      let evt = receipt.events.find((v) => v.event === 'LockRegistered')
      lockAddress = evt.args.lockAddress
      assert(lockAddress)
    })

    it('should change PublicLock::maxKeysPerAddress', async () => {
      let lockOwner
      ;[, , lockOwner] = await ethers.getSigners()

      await outwave
        .connect(lockOwner)
        .eventLockSetMaxKeysPerAddress(lockAddress, 3)

      let PublicLock = await ethers.getContractFactory('PublicLock')
      publiclock = await PublicLock.attach(lockAddress)
      assert.equal(await publiclock.maxKeysPerAddress(), 3)
    })

    it('should allow user to purchase multiple keys', async () => {
      let recipient
      ;[, recipient] = await ethers.getSigners()

      let PublicLock = await ethers.getContractFactory('PublicLock')
      publiclock = await PublicLock.attach(lockAddress)

      for (let index = 0; index < 3; index++) {
        let trx = await publiclock.purchase(
          [keyPrice],
          [recipient.address],
          [web3.utils.padLeft(0, 40)],
          [web3.utils.padLeft(0, 40)],
          [[]],
          {
            value: keyPrice,
          }
        )

        const receipt = await trx.wait()
        const evt = receipt.events.find((v) => v.event === 'Transfer')
        const tokenId = evt.args.tokenId
        assert(tokenId)
      }
    })
  })

  describe('set max keys per address / security ', () => {
    let outwave
    let lockAddress
    let user1
    let publiclock
    let randomWallet = ethers.Wallet.createRandom()

    before(async () => {
      let addresses = await require('../helpers/deploy').deployUnlock('10')
      let outwaveFactory = await ethers.getContractFactory('OutwaveEvent')
      outwave = await outwaveFactory.attach(addresses.outwaveAddress)
      ;[, , user1] = await ethers.getSigners()

      await outwave.updateOutwavePaymentAddress(randomWallet.address) // set dao payment address

      const tx = await outwave.connect(user1).eventCreate(
        web3.utils.padLeft(web3.utils.asciiToHex('1'), 64),
        'name',
        web3.utils.padLeft(0, 40), // address(0),
        keyPrice,
        10, // num keys
        1,
        web3.utils.padLeft(web3.utils.asciiToHex('2'), 64)
      )
      let receipt = await tx.wait()
      // verify events
      let evt = receipt.events.find((v) => v.event === 'LockRegistered')
      lockAddress = evt.args.lockAddress
      assert(lockAddress)

      await outwave.connect(user1).eventLockSetMaxKeysPerAddress(lockAddress, 3)
    })

    it('should NOT allow user to purchase more keys than maxKeysPerAddress', async () => {
      let recipient
      ;[, recipient] = await ethers.getSigners()

      let PublicLock = await ethers.getContractFactory('PublicLock')
      publiclock = await PublicLock.attach(lockAddress)

      // allowed purchases
      await Promise.all([
        publiclock.purchase(
          [keyPrice],
          [recipient.address],
          [web3.utils.padLeft(0, 40)],
          [web3.utils.padLeft(0, 40)],
          [[]],
          {
            value: keyPrice,
          }
        ),
        publiclock.purchase(
          [keyPrice],
          [recipient.address],
          [web3.utils.padLeft(0, 40)],
          [web3.utils.padLeft(0, 40)],
          [[]],
          {
            value: keyPrice,
          }
        ),
        publiclock.purchase(
          [keyPrice],
          [recipient.address],
          [web3.utils.padLeft(0, 40)],
          [web3.utils.padLeft(0, 40)],
          [[]],
          {
            value: keyPrice,
          }
        ),
      ])

      const unallowedPurchase = publiclock.purchase(
        [keyPrice],
        [recipient.address],
        [web3.utils.padLeft(0, 40)],
        [web3.utils.padLeft(0, 40)],
        [[]],
        {
          value: keyPrice,
        }
      )

      await reverts(unallowedPurchase, 'MAX_KEYS')
    })
  })
})
