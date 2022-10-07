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
  describe('disable event / behaviour ', () => {
    let outwave
    let lockAddress // the address of the lock
    let addr1 // user 1
    let addr2
    let addr3
    let nftPrice = web3.utils.toWei('0.01', 'ether')

    before(async () => {
      let addresses = await require('../helpers/deploy').deployUnlock('10')
      outwave = await ethers.getContractAt(
        'IEventOrganizationManagerMixin',
        addresses.outwaveAddress
      )
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
    it('shuold ensure locks created, actually allows buying keys (nft)', async () => {
      // let PublicLock = await ethers.getContractFactory('PublicLock')
      // let publiclock = await PublicLock.attach(lockAddress)

      let publiclock = await ethers.getContractAt('IEventLock', lockAddress)

      await publiclock
        .connect(addr2)
        .purchase(
          [nftPrice],
          [addr2.address],
          [web3.utils.padLeft(0, 40)],
          [web3.utils.padLeft(0, 40)],
          [[]],
          {
            from: addr2.address,
            value: nftPrice,
          }
        )

      // TODO: understand why gas fees are taken from the overall
      // console.log("-------nftprice:" + nftPrice)
      // console.log("------  balance:" + await web3.eth.getBalance(lockAddress))
    })
    it('user actually send money that is stored in contract', async () => {
      const balance = await web3.eth.getBalance(lockAddress)
      //   assert.equal(balance.toString(), nftPrice)
      assert.notEqual(balance, 0)
    })

    it('should disable event ', async () => {
      ;[, addr1] = await ethers.getSigners()
      const tx = await outwave
        .connect(addr1)
        .eventDisable(web3.utils.padLeft(web3.utils.asciiToHex('1'), 64))
      let receipt = await tx.wait()

      // verify events
      let eventCreate = receipt.events.find((v) => v.event === 'EventDisabled')
      assert.equal(
        eventCreate.args.eventId,
        web3.utils.padLeft(web3.utils.asciiToHex('1'), 64)
      )
      assert.equal(eventCreate.args.owner, addr1.address)

      let evt = receipt.events.find((v) => v.event === 'LockDeregistered')
      assert.equal(evt.args.owner, addr1.address)
      assert.equal(
        evt.args.eventId,
        web3.utils.padLeft(web3.utils.asciiToHex('1'), 64)
      )
      assert.equal(evt.args.lockAddress, lockAddress)
    })
    it('locks of disabled events are actually disabled: cannot purchase additional keys (nft)', async () => {
      let PublicLock = await ethers.getContractFactory('PublicLock')
      let publiclock = await PublicLock.attach(lockAddress)

      await reverts(
        publiclock
          .connect(addr3)
          .purchase(
            [web3.utils.toWei('0.01', 'ether')],
            [addr3.address],
            [web3.utils.padLeft(0, 40)],
            [web3.utils.padLeft(0, 40)],
            [[]],
            {
              from: addr3.address,
              value: web3.utils.toWei('0.01', 'ether'),
            }
          ),
        'LOCK_SOLD_OUT'
      )
    })
  })
  describe('disable event lock / security', () => {
    let outwave
    let owner
    let addr1 // user 1
    let addr2 // user 2
    let eventId = web3.utils.padLeft(web3.utils.asciiToHex('1'), 64)

    before(async () => {
      let addresses = await require('../helpers/deploy').deployUnlock('10')
      let outwaveFactory = await ethers.getContractFactory('OutwaveEvent')
      outwave = await outwaveFactory.attach(addresses.outwaveAddress)
      ;[owner, addr1, addr2] = await ethers.getSigners()

      await outwave.connect(addr1).eventCreate(
        eventId,
        'name',
        web3.utils.padLeft(0, 40), // address(0)
        web3.utils.toWei('0.01', 'ether'),
        100000,
        100,
        web3.utils.padLeft(web3.utils.asciiToHex('2'), 64)
      )
    })

    it('should NOT allow disabling from a different account (not owner)', async () => {
      await reverts(
        outwave.connect(addr2).eventDisable(eventId),
        'USER_NOT_EVENT_OWNER'
      )
    })
    it('should NOT allow updating even from outwave owner (not owner)', async () => {
      await reverts(
        outwave.connect(owner).eventDisable(eventId),
        'USER_NOT_EVENT_OWNER'
      )
    })
  })
})
