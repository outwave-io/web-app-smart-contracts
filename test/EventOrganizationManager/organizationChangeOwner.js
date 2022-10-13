const { assert } = require('chai')
const { ethers } = require('hardhat')
const { reverts } = require('truffle-assertions')

contract('Organization Event Manager', () => {
  const newOwner = '0x2CAF3950d36D92165dc7b51DCeA3f1314cE20B84'

  describe('change organization owner / behavior ', () => {
    let outwave
    let keyPrice = web3.utils.toWei('0.01', 'ether')
    let addr1
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
      await ethers.getSigners()
    })

    it('should successfully change organization owner', async () => {
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

      let eventCreate = receipt.events.find((v) => v.event === 'EventCreated')
      assert.equal(
        eventCreate.args.eventId,
        web3.utils.padLeft(web3.utils.asciiToHex('1'), 64)
      )
      assert.equal(eventCreate.args.owner, addr1.address)

      // change owner and performs checks
      assert.isTrue(await outwave.organizationIsOwned(eventCreate.args.owner))

      const chTx = await outwave
        .connect(addr1)
        .organizationChangeOwner(newOwner)
      let chReceipt = await chTx.wait()

      // check event consistency
      let orgOwnerChanged = chReceipt.events.find(
        (v) => v.event === 'OrganizationOwnerChanged'
      )
      assert.equal(orgOwnerChanged.args.actualOwner, addr1.address)
      assert.equal(orgOwnerChanged.args.newOwner, newOwner)

      assert.isTrue(await outwave.organizationIsOwned(newOwner))
      assert.isFalse(await outwave.organizationIsOwned(eventCreate.args.owner))
    })
  })

  describe('change organization owner / security', () => {
    let outwave
    let addr1
    let addr2
    let addr3

    before(async () => {
      let addresses = await require('../helpers/deploy').deployUnlock('10')
      let outwaveFactory = await ethers.getContractFactory('OutwaveEvent')
      outwave = await outwaveFactory.attach(addresses.outwaveAddress)
      ;[, addr1, addr2, addr3] = await ethers.getSigners()

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
    })

    it('should fail with UNAUTHORIZED_SENDER_NOT_OWNER if sender is not an owner', async () => {
      await reverts(
        outwave.connect(addr2).organizationChangeOwner(newOwner),
        'UNAUTHORIZED_SENDER_NOT_OWNER'
      )
    })

    it('should fail with UNAUTHORIZED_ALREADY_OWNED if the new owner is already assigned', async () => {
      const tx = await outwave.connect(addr3).eventCreate(
        web3.utils.padLeft(web3.utils.asciiToHex('2'), 64),
        'name',
        web3.utils.padLeft(0, 40), // address(0)
        web3.utils.toWei('0.01', 'ether'),
        100000,
        100,
        web3.utils.padLeft(web3.utils.asciiToHex('2'), 64)
      )
      await tx.wait()

      await reverts(
        outwave.connect(addr1).organizationChangeOwner(addr3.address),
        'UNAUTHORIZED_ALREADY_OWNED'
      )
    })
  })
})
