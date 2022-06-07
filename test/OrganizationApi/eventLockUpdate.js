const { assert } = require('chai')
const { ethers } = require('hardhat')
const { reverts } = require('truffle-assertions')

contract('OutwaveEvent', () => {
  describe('update event lock / behaviour ', () => {
    let outwave
    let lockAddress // the address of the lock
    let addr1 // user 1

    before(async () => {
      let addresses = await require('../helpers/deploy').deployUnlock('10')
      let outwaveFactory = await ethers.getContractFactory('OutwaveEvent')
      outwave = await outwaveFactory.attach(addresses.outwaveAddress)
      ;[, addr1] = await ethers.getSigners()

      const tx = await outwave.connect(addr1).eventCreate(
        web3.utils.padLeft(web3.utils.asciiToHex('1'), 64),
        'name',
        web3.utils.padLeft(0, 40), // address(0)
        web3.utils.toWei('0.01', 'ether'),
        100000,
        1,
        'ipfs://QmdBAufFCb7ProgWvWaNkZmeLDdPLXRKF3ku5tpe99vpPx'
      )
      await tx.wait()

      let receipt = await tx.wait()
      let evt = receipt.events.find((v) => v.event === 'LockRegistered')
      lockAddress = evt.args.lockAddress
    })

    it('should update [lockName], [keyPrice] and [maxNumberOfKeys] and should emit event LockUpadated ', async () => {
      ;[, addr1] = await ethers.getSigners()
      const tx = await outwave
        .connect(addr1)
        .eventLockUpdate(
          lockAddress,
          'updatedName',
          web3.utils.toWei('1', 'ether'),
          ethers.BigNumber.from(3000000)
        )
      let receipt = await tx.wait()
      let evt = receipt.events.find((v) => v.event === 'LockUpdated')
      let lockAddress2 = evt.args.lockAddress
      assert.equal(lockAddress, lockAddress2)

      // check the values using IReadLock
      const readLock = await ethers.getContractAt('ILockManager', lockAddress)
      assert.equal(await readLock.name(), 'updatedName')
      assert.equal(await readLock.keyPrice(), web3.utils.toWei('1', 'ether'))
      assert.isTrue(
        (await readLock.maxNumberOfKeys()).eq(ethers.BigNumber.from(3000000))
      )
      // assert.equal(await readLock.maxNumberOfKeys(), ethers.BigNumber.from(3000000)) // cannot be used due to js imprecision
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
        1,
        'ipfs://QmdBAufFCb7ProgWvWaNkZmeLDdPLXRKF3ku5tpe99vpPx'
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
            ethers.BigNumber.from(3000000)
          ),
        'USER_NOT_OWNER'
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
            ethers.BigNumber.from(3000000)
          ),
        'USER_NOT_OWNER'
      )
    })
  })
})
