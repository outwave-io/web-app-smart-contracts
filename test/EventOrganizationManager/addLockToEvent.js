const { assert } = require('chai')
const { ethers } = require('hardhat')
const { reverts } = require('truffle-assertions')

contract('Organization Event Manager', () => {
  describe('add lock to event / behavior ', () => {
    let outwave
    let lockAddress // the address of the lock
    let addr1 // user 1
    // let addr2 // user 2

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
        'ipfs://QmdBAufFCb7ProgWvWaNkZmeLDdPLXRKF3ku5tpe99vpPx',
        web3.utils.padLeft(web3.utils.asciiToHex('2'), 64)
      )
      await tx.wait()

      let receipt = await tx.wait()
      let evt = receipt.events.find((v) => v.event === 'LockRegistered')
      lockAddress = evt.args.lockAddress
    })

    it('should create new lock successfully and emit event LockRegistered when created', async () => {
      ;[, addr1] = await ethers.getSigners()
      const eventId = web3.utils.padLeft(web3.utils.asciiToHex('1'), 64)
      const newLockId = web3.utils.padLeft(web3.utils.asciiToHex('3'), 64)
      const tx = await outwave.connect(addr1).addLockToEvent(
        web3.utils.padLeft(web3.utils.asciiToHex('1'), 64), // same event id
        'name2',
        web3.utils.padLeft(0, 40), // address(0)
        web3.utils.toWei('0.01', 'ether'),
        100000,
        'ipfs://QmdBAufFCb7ProgWvWaNkZmeLDdPLXRKF3ku5tpe99vpPx',
        newLockId
      )
      let receipt = await tx.wait()
      let evt = receipt.events.find((v) => v.event === 'LockRegistered')
      assert(evt.args.lockAddress)
      assert.notEqual(evt.args.lockAddress, lockAddress)
      assert.equal(evt.args.eventId, eventId)
      assert.equal(evt.args.lockId, newLockId)
      assert.equal(evt.args.owner, addr1.address)
    })
  })

  /* SECURITY */

  describe('add lock to event / security', () => {
    let outwave
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
        'ipfs://QmdBAufFCb7ProgWvWaNkZmeLDdPLXRKF3ku5tpe99vpPx',
        web3.utils.padLeft(web3.utils.asciiToHex('2'), 64)
      )
      await tx.wait()
    })

    it('should NOT allow adding locks to event from a different account (not owner)', async () => {
      await reverts(
        outwave.connect(addr2).addLockToEvent(
          web3.utils.padLeft(web3.utils.asciiToHex('1'), 64), // same event id
          'name2',
          web3.utils.padLeft(0, 40), // address(0)
          web3.utils.toWei('0.01', 'ether'),
          100000,
          'ipfs://QmdBAufFCb7ProgWvWaNkZmeLDdPLXRKF3ku5tpe99vpPx',
          web3.utils.padLeft(web3.utils.asciiToHex('2'), 64) // same contract id
        ),
        'USER_NOT_EVENT_OWNER'
      )
    })

    it('should NOT allow adding locks to event from outwave owner (not owner)', async () => {
      await reverts(
        outwave.connect(owner).addLockToEvent(
          web3.utils.padLeft(web3.utils.asciiToHex('1'), 64), // same event id
          'name2',
          web3.utils.padLeft(0, 40), // address(0)
          web3.utils.toWei('0.01', 'ether'),
          100000,
          'ipfs://QmdBAufFCb7ProgWvWaNkZmeLDdPLXRKF3ku5tpe99vpPx',
          web3.utils.padLeft(web3.utils.asciiToHex('1'), 64) // same contract id
        ),
        'USER_NOT_EVENT_OWNER'
      )
    })

    it('should NOT allow adding locks to events that not exsists', async () => {
      await reverts(
        outwave.connect(addr1).addLockToEvent(
          web3.utils.padLeft(web3.utils.asciiToHex('2'), 64), // different event id
          'name2',
          web3.utils.padLeft(0, 40), // address(0)
          web3.utils.toWei('0.01', 'ether'),
          100000,
          'ipfs://QmdBAufFCb7ProgWvWaNkZmeLDdPLXRKF3ku5tpe99vpPx',
          web3.utils.padLeft(web3.utils.asciiToHex('1'), 64) // different contract id
        ),
        'USER_NOT_EVENT_OWNER'
      )
    })
  })
})
