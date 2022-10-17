const { assert } = require('chai')
const { ethers } = require('hardhat')
const { reverts } = require('truffle-assertions')

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
  describe('create event / behavior ', () => {
    let outwave
    let lockAddress
    let keyPrice = web3.utils.toWei('0.01', 'ether')
    let addr1
    let user1
    const baseTokenUri = 'https://uri.com/'

    before(async () => {
      let addresses = await require('../helpers/deploy').deployUnlock('10')
      let outwaveFactory = await ethers.getContractFactory('OutwaveEvent')
      let outwaveManager = await outwaveFactory.attach(addresses.outwaveAddress)
      outwave = await ethers.getContractAt(
        'IEventOrganizationManagerMixin',
        addresses.outwaveAddress
      )
      await outwaveManager.setBaseTokenUri(baseTokenUri)
      ;[, user1] = await ethers.getSigners()
    })

    it('should create successfully and emit events EventCreated and LockRegistered when created', async () => {
      ;[, addr1] = await ethers.getSigners()
      const tx = await outwave.connect(addr1).eventCreate(
        web3.utils.padLeft(web3.utils.asciiToHex('1'), 64),
        'name',
        web3.utils.padLeft(0, 40), // address(0)
        keyPrice,
        100000,
        100,
        web3.utils.padLeft(web3.utils.asciiToHex('2'), 64)
      )
      let receipt = await tx.wait()
      // verify events
      let eventCreate = receipt.events.find((v) => v.event === 'EventCreated')
      assert.equal(
        eventCreate.args.eventId,
        web3.utils.padLeft(web3.utils.asciiToHex('1'), 64)
      )
      assert.equal(eventCreate.args.owner, addr1.address)

      let evt = receipt.events.find((v) => v.event === 'LockRegistered')
      assert.equal(
        evt.args.lockId,
        web3.utils.padLeft(web3.utils.asciiToHex('2'), 64)
      )

      lockAddress = evt.args.lockAddress
      assert(lockAddress)
    })

    it('should create an actual Public Lock, returning a valid version', async () => {
      let PublicLock = await ethers.getContractFactory('PublicLock')
      let publiclock = await PublicLock.attach(lockAddress)
      assert.equal(await publiclock.publicLockVersion(), 10)
    })
    it('should create an smart contract implementing IEventLock, returning a valid name', async () => {
      let readlock = await ethers.getContractAt('IEventLock', lockAddress)
      assert.equal(await readlock.name(), 'name')
    })
    it('should implement erc721 and return corect tokenuri, returning a valid name', async () => {
      const erc721 = new ethers.Contract(
        lockAddress,
        [
          'function tokenURI(uint256 tokenId) public view returns (string memory)',
        ],
        user1
      )
      let uri = await erc721.tokenURI(1)
      assert.equal(
        uri.toLowerCase(),
        (baseTokenUri + lockAddress).toLowerCase()
      )
    })
  })
  describe('create event / security', () => {
    let outwave
    let lockAddress // the address of the lock
    let addr1
    let addr2

    before(async () => {
      let addresses = await require('../helpers/deploy').deployUnlock('10')
      let outwaveFactory = await ethers.getContractFactory('OutwaveEvent')
      outwave = await outwaveFactory.attach(addresses.outwaveAddress)
      ;[, addr1, addr2] = await ethers.getSigners()

      const tx = await outwave.connect(addr1).eventCreate(
        web3.utils.padLeft(web3.utils.asciiToHex('1'), 64),
        'name',
        web3.utils.padLeft(0, 40), // address(0)
        web3.utils.toWei('0.01', 'ether'),
        100000,
        100,
        web3.utils.padLeft(web3.utils.asciiToHex('2'), 64)
      )

      let receipt = await tx.wait()
      let evt = receipt.events.find((v) => v.event === 'LockRegistered')
      lockAddress = evt.args.lockAddress
    })
    it('should NOT allow lock creator to manage directly the publiclock', async () => {
      let PublicLock = await ethers.getContractFactory('PublicLock')
      let publiclock = await PublicLock.attach(lockAddress)

      let [, addr1] = await ethers.getSigners()
      await reverts(
        publiclock.connect(addr1).updateLockName('new name updated'),
        'ONLY_LOCK_MANAGER'
      )
    })

    it('should NOT allow creating multiple events with the same id for same user', async () => {
      let [, addr1] = await ethers.getSigners()
      await reverts(
        outwave.connect(addr1).eventCreate(
          web3.utils.padLeft(web3.utils.asciiToHex('1'), 64),
          'name',
          web3.utils.padLeft(0, 40), // address(0)
          web3.utils.toWei('0.01', 'ether'),
          100000,
          100,
          web3.utils.padLeft(web3.utils.asciiToHex('2'), 64)
        ),
        'EVENT_ID_ALREADY_EXISTS'
      )
    })
    it('should NOT allow creating events with the same id even for different user', async () => {
      let [, , addr2] = await ethers.getSigners()
      await reverts(
        outwave.connect(addr2).eventCreate(
          web3.utils.padLeft(web3.utils.asciiToHex('1'), 64),
          'name',
          web3.utils.padLeft(0, 40), // address(0)
          web3.utils.toWei('0.01', 'ether'),
          100000,
          100,
          web3.utils.padLeft(web3.utils.asciiToHex('2'), 64)
        ),
        'EVENT_ID_ALREADY_EXISTS'
      )
    })
    it('should create a public lock where lockmanager is Outwave and not by msg.sender', async () => {
      let PublicLock = await ethers.getContractFactory('PublicLock')
      let publiclock = await PublicLock.attach(lockAddress)
      assert.isTrue(
        await publiclock.connect(addr1).isLockManager(outwave.address)
      ) // outwave
      assert.isFalse(
        await publiclock.connect(addr1).isLockManager(addr1.address)
      )
      assert.isFalse(
        await publiclock.connect(addr1).isLockManager(addr2.address)
      )
    })
    it('should create a public lock where mimic owner is implmented to correct owner', async () => {
      let PublicLock = await ethers.getContractFactory('PublicLock')
      let publiclock = await PublicLock.attach(lockAddress)
      assert.isTrue(await publiclock.connect(addr1).isOwner(addr1.address)) // lock owner
      assert.isFalse(await publiclock.connect(addr1).isOwner(addr2.address))
      assert.isFalse(await publiclock.connect(addr1).isOwner(outwave.address))
    })
  })
})
