const { assert } = require('chai')
const { ethers } = require('hardhat')
const { reverts } = require('truffle-assertions')

contract('Event Transferable', () => {
  describe('upgradableEventManagers - add - remove - is allowed / behavior', () => {
    let outwave
    let anyAddress = ethers.Wallet.createRandom().address

    before(async () => {
      let addresses = await require('../helpers/deploy').deployUnlock('10')

      let outwaveFactory = await ethers.getContractFactory('OutwaveEvent')
      outwave = await outwaveFactory.attach(addresses.outwaveAddress)
      // lets create one event
    })

    it('should return false for random anddress', async () => {
      assert.isFalse(
        await outwave.upgradableEventManagersIsAllowed(
          ethers.Wallet.createRandom().address
        )
      )
    })

    it('should allow to add using upgradableEventManagersAdd', async () => {
      await outwave.upgradableEventManagersAdd(anyAddress)
    })

    it('should return true for added anddress', async () => {
      assert.isTrue(await outwave.upgradableEventManagersIsAllowed(anyAddress))
    })

    it('should allow to remove using upgradableEventManagersAdd', async () => {
      await outwave.upgradableEventManagersRemove(anyAddress)
    })

    it('should return false for removed anddress', async () => {
      assert.isFalse(await outwave.upgradableEventManagersIsAllowed(anyAddress))
    })
  })

  describe('upgradableEventManagers - add - remove - is allowed / security ', () => {
    let outwave
    let user1
    let anyAddressFromOwner = ethers.Wallet.createRandom().address
    let anyAddressFromUser = ethers.Wallet.createRandom().address

    before(async () => {
      let addresses = await require('../helpers/deploy').deployUnlock('10')

      let outwaveFactory = await ethers.getContractFactory('OutwaveEvent')
      outwave = await outwaveFactory.attach(addresses.outwaveAddress)
      ;[, user1] = await ethers.getSigners()
    })
    it('should allow owner set', async () => {
      await outwave.upgradableEventManagersAdd(anyAddressFromOwner)
    })
    it('should allow any user verify if address is allowed', async () => {
      assert.isTrue(
        await outwave
          .connect(user1)
          .upgradableEventManagersIsAllowed(anyAddressFromOwner)
      )
    })
    it('should not allow set from user not owner', async () => {
      await reverts(
        outwave.connect(user1).upgradableEventManagersAdd(anyAddressFromUser),
        'Ownable: caller is not the owner'
      )
    })
    it('should not allow remove from user not owner', async () => {
      await reverts(
        outwave
          .connect(user1)
          .upgradableEventManagersRemove(anyAddressFromOwner),
        'Ownable: caller is not the owner'
      )
    })
  })

  describe('register and deregisgter locks / behavior ', () => {
    let outwave
    let addr1
    let ownerAddress = ethers.Wallet.createRandom().address
    let eventId = web3.utils.padLeft(web3.utils.asciiToHex('event'), 64)
    let entityAddress = ethers.Wallet.createRandom().address
    let lockId = web3.utils.padLeft(web3.utils.asciiToHex('lock'), 64)

    before(async () => {
      let addresses = await require('../helpers/deploy').deployUnlock('10')
      let outwaveFactory = await ethers.getContractFactory('OutwaveEvent')
      outwave = await outwaveFactory.attach(addresses.outwaveAddress)
      ;[, addr1] = await ethers.getSigners()
      // user 1 can operate on register and deregister
      await outwave.upgradableEventManagersAdd(addr1.address)
    })

    it('should register and emit correctly event', async () => {
      const tx = await outwave
        .connect(addr1)
        .eventLockRegister(ownerAddress, eventId, entityAddress, lockId)
      let receipt = await tx.wait()
      let evt = receipt.events.find((v) => v.event === 'LockRegistered')
      assert.equal(evt.args.lockAddress, entityAddress)
      assert.equal(evt.args.eventId, eventId)
      assert.equal(evt.args.lockId, lockId)
      assert.equal(evt.args.owner, ownerAddress)
    })

    it('should NOT deregister if wrong owerAddress is given for specific eventId', async () => {
      await reverts(
        outwave
          .connect(addr1)
          .eventLockDeregister(
            ethers.Wallet.createRandom().address,
            eventId,
            entityAddress
          ),
        'CORE_USER_NOT_OWNER'
      )
    })

    it('should NOT deregister if wrong eventId is given for specific eventId', async () => {
      await reverts(
        outwave
          .connect(addr1)
          .eventLockDeregister(
            ownerAddress,
            web3.utils.padLeft(web3.utils.asciiToHex('event any'), 64),
            entityAddress
          ),
        'CORE_EVENTID_INVALID'
      )
    })

    it('should deregister and emit correctly event', async () => {
      const tx = await outwave
        .connect(addr1)
        .eventLockDeregister(ownerAddress, eventId, entityAddress)
      let receipt = await tx.wait()
      let evt = receipt.events.find((v) => v.event === 'LockDeregistered')
      assert.equal(evt.args.lockAddress, entityAddress)
      assert.equal(evt.args.eventId, eventId)
      assert.equal(evt.args.lockId, lockId)
      assert.equal(evt.args.owner, ownerAddress)
    })
  })

  describe('register and deregisgter locks / security ', () => {
    let outwave
    let addr1
    let addr2
    let addr3Mal
    let ownerAddress = ethers.Wallet.createRandom().address
    let eventId = web3.utils.padLeft(web3.utils.asciiToHex('event'), 64)
    let entityAddress = ethers.Wallet.createRandom().address
    let lockId = web3.utils.padLeft(web3.utils.asciiToHex('lock'), 64)

    before(async () => {
      let addresses = await require('../helpers/deploy').deployUnlock('10')
      let outwaveFactory = await ethers.getContractFactory('OutwaveEvent')
      outwave = await outwaveFactory.attach(addresses.outwaveAddress)
      ;[, addr1, addr2, addr3Mal] = await ethers.getSigners()
      // user 1 and 2 can operate on register and deregister
      await outwave.upgradableEventManagersAdd(addr1.address)
      await outwave.upgradableEventManagersAdd(addr2.address)
    })

    it('should allow register from valid address', async () => {
      await outwave
        .connect(addr1)
        .eventLockRegister(ownerAddress, eventId, entityAddress, lockId)
    })

    it('should not allow mulitiple register with same lockaddress ', async () => {
      await reverts(
        outwave
          .connect(addr2)
          .eventLockRegister(
            ownerAddress,
            web3.utils.padLeft(web3.utils.asciiToHex('event2'), 64),
            entityAddress,
            lockId
          ),
        'CORE_LOCK_ADDRESS_EXISTS'
      )
    })

    it('should allow register from different valid user', async () => {
      await outwave
        .connect(addr2)
        .eventLockRegister(
          ethers.Wallet.createRandom().address,
          web3.utils.padLeft(web3.utils.asciiToHex('event2'), 64),
          entityAddress,
          lockId
        )
    })

    it('should NOT register if user is not added as upgradableEventManagersAdd', async () => {
      await reverts(
        outwave
          .connect(addr3Mal)
          .eventLockRegister(
            ownerAddress,
            web3.utils.padLeft(web3.utils.asciiToHex('event3'), 64),
            entityAddress,
            lockId
          ),
        'UNAUTHORIZED'
      )
    })

    it('should NOT deregister if user is not added as upgradableEventManagersAdd', async () => {
      await reverts(
        outwave
          .connect(addr3Mal)
          .eventLockDeregister(ownerAddress, eventId, entityAddress),
        'UNAUTHORIZED'
      )
    })
  })
})
