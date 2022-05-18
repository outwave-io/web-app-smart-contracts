const { assert } = require('chai')
const { ethers } = require('hardhat')
const { reverts } = require('truffle-assertions')

contract('OutwaveEvent', () => {
  describe('create event / behavior ', () => {
    let outwave
    let lockAddress
    let addr1

    before(async () => {
      let addresses = await require('../helpers/deploy').deployUnlock('10')
      let outwaveFactory = await ethers.getContractFactory('OutwaveEvent')
      outwave = await outwaveFactory.attach(addresses.outwaveAddress)
    })

    it('should create successfully and emit event LockRegistered when created', async () => {
      ;[, addr1] = await ethers.getSigners()
      const tx = await outwave
        .connect(addr1)
        .eventCreate(
          1,
          ['name'],
          [web3.utils.toWei('0.01', 'ether')],
          [100000],
          [1],
          ['ipfs://QmdBAufFCb7ProgWvWaNkZmeLDdPLXRKF3ku5tpe99vpPx']
        )
      let receipt = await tx.wait()
      let evt = receipt.events.find((v) => v.event === 'LockRegistered')
      lockAddress = evt.args.lockAddress
      assert(lockAddress)
    })

    it('should return correct lock version', async () => {
      let version = await outwave.connect(addr1).publicLockVersion(lockAddress)
      assert.equal(version, 10)
    })
    it('should create an actual Public Lock, returning a valid version', async () => {
      let PublicLock = await ethers.getContractFactory('PublicLock')
      let publiclock = await PublicLock.attach(lockAddress)
      assert.equal(await publiclock.publicLockVersion(), 10)
    })
    it('should create an smart contract implementing IReadLock, returning a valid name', async () => {
      let readlock = await ethers.getContractAt('IReadLock', lockAddress)
      assert.equal(await readlock.name(), 'name')
    })
  })
  describe('create event / security', () => {
    let outwave
    let lockAddress // the address of the lock
    let addr1 // user 1
    let addr2 // user 2

    before(async () => {
      let addresses = await require('../helpers/deploy').deployUnlock('10')
      let outwaveFactory = await ethers.getContractFactory('OutwaveEvent')
      outwave = await outwaveFactory.attach(addresses.outwaveAddress)
      ;[, addr1, addr2] = await ethers.getSigners()

      const tx = await outwave
        .connect(addr1)
        .eventCreate(
          1,
          ['name'],
          [web3.utils.toWei('0.01', 'ether')],
          [100000],
          [1],
          ['ipfs://QmdBAufFCb7ProgWvWaNkZmeLDdPLXRKF3ku5tpe99vpPx']
        )
      await tx.wait()

      let receipt = await tx.wait()
      let evt = receipt.events.find((v) => v.event === 'LockRegistered')
      lockAddress = evt.args.lockAddress
    })

    it('should not allow creating multiple events with the same id for same user', async () => {
      let [, addr1] = await ethers.getSigners()
      await reverts(
        outwave
          .connect(addr1)
          .eventCreate(
            1,
            ['name'],
            [web3.utils.toWei('0.01', 'ether')],
            [100000],
            [1],
            ['ipfs://QmdBAufFCb7ProgWvWaNkZmeLDdPLXRKF3ku5tpe99vpPx']
          ),
        'EVENT_ID_NOTVALID'
      )
    })
    it('should allow creating events with the same id if different user', async () => {
      let [, , addr2] = await ethers.getSigners()
      const txAddr2 = await outwave
        .connect(addr2)
        .eventCreate(
          1,
          ['name'],
          [web3.utils.toWei('0.01', 'ether')],
          [100000],
          [1],
          ['ipfs://QmdBAufFCb7ProgWvWaNkZmeLDdPLXRKF3ku5tpe99vpPx']
        )
      await txAddr2.wait()
      assert(txAddr2)
    })
    it('should create a public lock owned by Outwave and not by msg.sender', async () => {
      let PublicLock = await ethers.getContractFactory('PublicLock')
      let publiclock = await PublicLock.attach(lockAddress)
      assert.isFalse(await publiclock.connect(addr1).isOwner(addr1.address))
      assert.isFalse(await publiclock.connect(addr1).isOwner(addr2.address))
      assert.isTrue(await publiclock.connect(addr1).isOwner(outwave.address)) // outwave
    })
  })
})
