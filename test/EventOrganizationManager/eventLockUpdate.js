const { assert } = require('chai')
const { ethers } = require('hardhat')
const { reverts } = require('truffle-assertions')
const { setSourceMapRange } = require('typescript')

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

  describe('update event lock / behaviour ', () => {
    let outwave
    let lockAddress // the address of the lock
    let addr1 // user 1

    before(async () => {
      let addresses = await require('../helpers/deploy').deployUnlock('10')
      outwave = await ethers.getContractAt("IEventOrganizationManagerMixin", addresses.outwaveAddress);
      ;[, addr1] = await ethers.getSigners()

      const tx = await outwave.connect(addr1).eventCreate(
        web3.utils.padLeft(web3.utils.asciiToHex('1'), 64),
        'name',
        web3.utils.padLeft(0, 40), // address(0)
        web3.utils.toWei('0.01', 'ether'),
        100000,
        100,
        web3.utils.padLeft(web3.utils.asciiToHex('2'), 64)
      )
      await tx.wait()

      let receipt = await tx.wait()
      let evt = receipt.events.find((v) => v.event === 'LockRegistered')
      lockAddress = evt.args.lockAddress
    })

    it('should update [lockName], [keyPrice], [maxNumberOfKeys] and [maxKeysPerAddress] and should emit event LockUpadated ', async () => {
      ;[, addr1] = await ethers.getSigners()
      const tx = await outwave
        .connect(addr1)
        .eventLockUpdate(
          lockAddress,
          'updatedName',
          web3.utils.toWei('1', 'ether'),
          ethers.BigNumber.from(3000000),
          ethers.BigNumber.from(3)
        )
      let receipt = await tx.wait()
      let evt = receipt.events.find((v) => v.event === 'LockUpdated')
      let lockAddress2 = evt.args.lockAddress
      assert.equal(lockAddress, lockAddress2)

      // check the values using IReadLock
      const readLock = await ethers.getContractAt('IEventLock', lockAddress)
      assert.equal(await readLock.name(), 'updatedName')
      assert.equal(await readLock.keyPrice(), web3.utils.toWei('1', 'ether'))
      assert.isTrue(
        (await readLock.maxNumberOfKeys()).eq(ethers.BigNumber.from(3000000))
      )
      assert.isTrue(
        (await readLock.maxKeysPerAddress()).eq(ethers.BigNumber.from(3))
      )
      // assert.equal(await readLock.maxNumberOfKeys(), ethers.BigNumber.from(3000000)) // cannot be used due to js imprecision
    })

    it('should NOT allow user to purchase more keys than maxKeysPerAddress', async () => {
      const keyPrice = web3.utils.toWei('1', 'ether')
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
  describe('update event lock / security', () => {
    let outwave
    let lockAddress // the address of the lock
    let owner
    let addr1 // user 1
    let addr2 // user 2

    before(async () => {
      let addresses = await require('../helpers/deploy').deployUnlock('10')
      let outwaveFactory = await ethers.getContractFactory('OutwaveEvent')
      outwave = await outwaveFactory.attach(addresses.outwaveAddress)
      ;[owner, addr1, addr2] = await ethers.getSigners()

      const tx = await outwave.connect(addr1).eventCreate(
        web3.utils.padLeft(web3.utils.asciiToHex('1'), 64),
        'name',
        web3.utils.padLeft(0, 40), // address(0)
        web3.utils.toWei('0.01', 'ether'),
        100000,
        100,
        web3.utils.padLeft(web3.utils.asciiToHex('2'), 64)
      )
      await tx.wait()

      let receipt = await tx.wait()
      let evt = receipt.events.find((v) => v.event === 'LockRegistered')
      lockAddress = evt.args.lockAddress
    })

    it('should NOT allow updating from a different account (not owner)', async () => {
      await reverts(
        outwave
          .connect(addr2)
          .eventLockUpdate(
            lockAddress,
            'updatedName',
            web3.utils.toWei('1', 'ether'),
            ethers.BigNumber.from(3000000),
            ethers.BigNumber.from(3)
          ),
        'USER_NOT_LOCK_OWNER'
      )
    })
    it('should NOT allow updating even from outwave owner (not owner)', async () => {
      await reverts(
        outwave
          .connect(owner)
          .eventLockUpdate(
            lockAddress,
            'updatedName',
            web3.utils.toWei('1', 'ether'),
            ethers.BigNumber.from(3000000),
            ethers.BigNumber.from(3)
          ),
        'USER_NOT_LOCK_OWNER'
      )
    })
    it('should fails with CREATE_LOCKS_DISABLED on event creation when lock creation is disabled', async () => {
      let instance = outwave.connect(owner)
      await instance.outwaveAllowLockCreation(false)
      await reverts(
        instance.eventCreate(
          web3.utils.padLeft(web3.utils.asciiToHex('2'), 64),
          'othername',
          web3.utils.padLeft(0, 40), // address(0)
          web3.utils.toWei('0.01', 'ether'),
          100000,
          100,
          web3.utils.padLeft(web3.utils.asciiToHex('2'), 64)
        ),
        'CREATE_LOCKS_DISABLED'
      )
    })
  })
})
