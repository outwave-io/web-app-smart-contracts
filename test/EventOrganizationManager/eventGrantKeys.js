const { assert } = require('chai')
const { ethers } = require('hardhat')
const { reverts } = require('truffle-assertions')

contract('Organization Event Manager', () => {
  describe('event grant keys event / behaviour ', () => {
    let outwave
    let lockAddress // the address of the lock
    let addr1 // user 1
    let addr2
    let addr3
    let addr4
    let nftPrice = web3.utils.toWei('0.01', 'ether')

    before(async () => {
      let addresses = await require('../helpers/deploy').deployUnlock('10')
      let outwaveFactory = await ethers.getContractFactory('OutwaveEvent')
      outwave = await outwaveFactory.attach(addresses.outwaveAddress)
      ;[, addr1, addr2, addr3, addr4] = await ethers.getSigners()

      const tx = await outwave.connect(addr1).eventCreate(
        web3.utils.padLeft(web3.utils.asciiToHex('1'), 64),
        'name',
        web3.utils.padLeft(0, 40), // address(0)
        nftPrice,
        100000,
        100,
        web3.utils.padLeft(web3.utils.asciiToHex('2'), 64)
      )
      await tx.wait()

      let receipt = await tx.wait()
      let evt = receipt.events.find((v) => v.event === 'LockRegistered')
      lockAddress = evt.args.lockAddress
    })
    it('shuold grant keys for free', async () => {
      await outwave
        .connect(addr1)
        .eventGrantKeys(lockAddress, [addr2.address, addr3.address])
    })
    it('shuold receivers have received keys', async () => {
      let readlock = await ethers.getContractAt('IEventLock', lockAddress)
      assert.equal(await readlock.balanceOf(addr2.address), 1)
      assert.equal(await readlock.balanceOf(addr3.address), 1)
    })
    it('shuold NOT give free key to ubknow user', async () => {
      let readlock = await ethers.getContractAt('IEventLock', lockAddress)
      assert.equal(await readlock.balanceOf(addr4.address), 0)
    })
  })
  describe('event grant keys event / security', () => {
    let outwave
    let lockAddress // the address of the lock
    let addr1 // user 1
    let addr2
    let addr3

    let nftPrice = web3.utils.toWei('0.01', 'ether')

    before(async () => {
      let addresses = await require('../helpers/deploy').deployUnlock('10')
      let outwaveFactory = await ethers.getContractFactory('OutwaveEvent')
      outwave = await outwaveFactory.attach(addresses.outwaveAddress)
      ;[, addr1, addr2, addr3] = await ethers.getSigners()

      const tx = await outwave.connect(addr1).eventCreate(
        web3.utils.padLeft(web3.utils.asciiToHex('1'), 64),
        'name',
        web3.utils.padLeft(0, 40), // address(0)
        nftPrice,
        100000,
        100,
        web3.utils.padLeft(web3.utils.asciiToHex('2'), 64)
      )
      await tx.wait()

      let receipt = await tx.wait()
      let evt = receipt.events.find((v) => v.event === 'LockRegistered')
      lockAddress = evt.args.lockAddress
    })

    it('shuold NOT allow to grant keys from different user', async () => {
      await reverts(
        outwave
          .connect(addr2)
          .eventGrantKeys(lockAddress, [addr2.address, addr3.address]),
        'USER_NOT_LOCK_OWNER'
      )
    })

    it('shuold NOT allow to grant keys if outwave manger has disabled new locks', async () => {
      await outwave.outwaveAllowLockCreation(false)

      await reverts(
        outwave
          .connect(addr1)
          .eventGrantKeys(lockAddress, [addr2.address, addr3.address]),
        'CREATE_LOCKS_DISABLED'
      )
    })
  })
})
