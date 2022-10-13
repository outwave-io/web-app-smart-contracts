const { assert } = require('chai')
const { ethers } = require('hardhat')
const { reverts } = require('truffle-assertions')

contract('Organization Event Manager', () => {
  describe('change organization owner / behavior ', () => {
    let outwave
    let keyPrice = web3.utils.toWei('0.01', 'ether')
    let addr1
    const baseTokenUri = 'https://uri.com/'
    const newOwner = '0x2CAF3950d36D92165dc7b51DCeA3f1314cE20B84'

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

      outwave.organizationChangeOwner(eventCreate.args.owner, newOwner)

      assert.isTrue(await outwave.organizationIsOwned(newOwner))
      assert.isFalse(await outwave.organizationIsOwned(eventCreate.args.owner))
    })

    it('should fail with ORGANIZATION_NOT_EXISTS when owner is not in state', async () => {
      const unknownAddr = '0x23165d9BDFD7921F8f7504F4569090b731df5A27'

      await reverts(
        outwave.organizationChangeOwner(unknownAddr, newOwner),
        'ORGANIZATION_NOT_EXISTS'
      )
    })
  })
})
