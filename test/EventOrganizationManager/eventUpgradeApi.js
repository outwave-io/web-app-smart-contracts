const { assert } = require('chai')
const { ethers } = require('hardhat')
const { reverts } = require('truffle-assertions')

contract('Organization Event Manager', () => {
  describe('upgrade event api / behavior ', () => {
    let outwaveSource
    let outwaveDestination
    let lockAddress
    let addr1
    let eventId = web3.utils.padLeft(web3.utils.asciiToHex('1'), 64)

    before(async () => {
      let addresses = await require('../helpers/deploy').deployUnlock('10')
      let addressesDest = await require('../helpers/deploy').deployUnlock('10')
      let outwaveFactory = await ethers.getContractFactory('OutwaveEvent')
      outwaveSource = await outwaveFactory.attach(addresses.outwaveAddress)
      outwaveDestination = await outwaveFactory.attach(
        addressesDest.outwaveAddress
      )

      await outwaveSource.upgradableEventManagersAdd(outwaveDestination.address)
      await outwaveDestination.upgradableEventManagersAdd(outwaveSource.address)

      // lets create one event
      ;[, addr1] = await ethers.getSigners()
      const tx = await outwaveSource.connect(addr1).eventCreate(
        eventId,
        'name',
        web3.utils.padLeft(0, 40), // address(0)
        web3.utils.toWei('0.01', 'ether'),
        100000,
        'ipfs://QmdBAufFCb7ProgWvWaNkZmeLDdPLXRKF3ku5tpe99vpPx',
        web3.utils.padLeft(web3.utils.asciiToHex('2'), 64)
      )
      let receipt = await tx.wait()
      let evt = receipt.events.find((v) => v.event === 'LockRegistered')
      lockAddress = evt.args.lockAddress
    })

    it('should have registered correctly in old manager api', async () => {
      const result = await outwaveSource
        .connect(addr1)
        ['eventLocksGetAll(bytes32)'](eventId)
      assert.isTrue(result[0].exists)
      assert.equal(result[0].lockAddress, lockAddress)
    })

    let tx
    it('should transfert event to a different lock', async () => {
      tx = await outwaveSource
        .connect(addr1)
        .eventUpgradeApi(eventId, outwaveDestination.address)
    })

    it('should have emited correctly all events', async () => {
      let receipt = await tx.wait()

      let evtLockReg = receipt.events.find((v) => v.event === 'LockRegistered')
      assert.equal(evtLockReg.args.eventId, eventId)
      assert.equal(
        evtLockReg.args.lockId,
        web3.utils.padLeft(web3.utils.asciiToHex('2'), 64)
      )
      assert.equal(evtLockReg.args.lockAddress, lockAddress)

      let evtLockDeReg = receipt.events.find(
        (v) => v.event === 'LockDeregistered'
      )
      assert.equal(
        evtLockDeReg.args.lockId,
        web3.utils.padLeft(web3.utils.asciiToHex('2'), 64)
      )
      assert.equal(
        evtLockDeReg.args.lockId,
        web3.utils.padLeft(web3.utils.asciiToHex('2'), 64)
      )
      assert.equal(evtLockDeReg.args.lockAddress, lockAddress)
    })

    it('should have registered correctly in new manager api', async () => {
      const result = await outwaveDestination
        .connect(addr1)
        ['eventLocksGetAll(bytes32)'](eventId)
      assert.isTrue(result[0].exists)
      assert.equal(result[0].lockAddress, lockAddress)
    })

    it('should have deregistered correctly in old manager api', async () => {
      const result = await outwaveSource
        .connect(addr1)
        ['eventLocksGetAll(bytes32)'](eventId)
      assert.isFalse(result[0].exists)
      assert.equal(result[0].lockAddress, lockAddress)
    })

    it('should allow event owner, manage the public lock through the migrated event manager', async () => {
      const newLockId = web3.utils.padLeft(web3.utils.asciiToHex('3'), 64)
      const tx = await outwaveDestination.connect(addr1).addLockToEvent(
        eventId, // same event id
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

  describe('upgrade event api / security ', () => {
    let outwaveSource
    let outwaveDestination
    let lockAddress
    let addr1
    let addr2
    let eventId = web3.utils.padLeft(web3.utils.asciiToHex('1'), 64)

    before(async () => {
      let addresses = await require('../helpers/deploy').deployUnlock('10')
      let addressesDest = await require('../helpers/deploy').deployUnlock('10')
      let outwaveFactory = await ethers.getContractFactory('OutwaveEvent')
      outwaveSource = await outwaveFactory.attach(addresses.outwaveAddress)
      outwaveDestination = await outwaveFactory.attach(
        addressesDest.outwaveAddress
      )

      // lets create one event
      ;[, addr1, addr2] = await ethers.getSigners()
      const tx = await outwaveSource.connect(addr1).eventCreate(
        eventId,
        'name',
        web3.utils.padLeft(0, 40), // address(0)
        web3.utils.toWei('0.01', 'ether'),
        100000,
        'ipfs://QmdBAufFCb7ProgWvWaNkZmeLDdPLXRKF3ku5tpe99vpPx',
        web3.utils.padLeft(web3.utils.asciiToHex('2'), 64)
      )
      let receipt = await tx.wait()
      let evt = receipt.events.find((v) => v.event === 'LockRegistered')
      lockAddress = evt.args.lockAddress
    })

    it('should NOT transfert event to a different lock if invalid evet manger address if not configured', async () => {
      await reverts(
        outwaveSource
          .connect(addr1)
          .eventUpgradeApi(eventId, outwaveDestination.address),
        'UNAUTHORIZED_DESTINATION_ADDRESS'
      )
    })

    it('should allow to set valid upgradable event manager address', async () => {
      await outwaveSource.upgradableEventManagersAdd(outwaveDestination.address)
      await outwaveDestination.upgradableEventManagersAdd(outwaveSource.address)
    })

    it('should NOT transfert event to a different lock if invalid evetn manger address is given', async () => {
      await reverts(
        outwaveSource
          .connect(addr1)
          .eventUpgradeApi(eventId, ethers.Wallet.createRandom().address),
        'UNAUTHORIZED_DESTINATION_ADDRESS'
      )
    })

    it('should transfert event to a different lock', async () => {
      await outwaveSource
        .connect(addr1)
        .eventUpgradeApi(eventId, outwaveDestination.address)
    })

    it('should have updated the owner', async () => {
      let PublicLock = await ethers.getContractFactory('PublicLock')
      let publiclock = await PublicLock.attach(lockAddress)

      assert.isTrue(
        await publiclock
          .connect(addr1)
          .isLockManager(outwaveDestination.address)
      ) // outwave
      assert.isFalse(
        await publiclock.connect(addr1).isLockManager(addr1.address)
      )
      assert.isFalse(
        await publiclock.connect(addr1).isLockManager(outwaveSource.address)
      )
    })

    it('should NOT allow diffrent user to manage the public lock', async () => {
      const newLockId = web3.utils.padLeft(web3.utils.asciiToHex('3'), 64)
      await outwaveDestination.connect(addr1).addLockToEvent(
        eventId, // same event id
        'name2',
        web3.utils.padLeft(0, 40), // address(0)
        web3.utils.toWei('0.01', 'ether'),
        100000,
        'ipfs://QmdBAufFCb7ProgWvWaNkZmeLDdPLXRKF3ku5tpe99vpPx',
        newLockId
      )

      const newLockId2 = web3.utils.padLeft(web3.utils.asciiToHex('4'), 64)
      await reverts(
        outwaveDestination.connect(addr2).addLockToEvent(
          eventId, // same event id
          'name2',
          web3.utils.padLeft(0, 40), // address(0)
          web3.utils.toWei('0.01', 'ether'),
          100000,
          'ipfs://QmdBAufFCb7ProgWvWaNkZmeLDdPLXRKF3ku5tpe99vpPx',
          newLockId2
        ),
        'USER_NOT_EVENT_OWNER'
      )
    })
  })
})
