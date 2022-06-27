const { assert } = require('chai')
const { ethers } = require('hardhat')
const { reverts } = require('truffle-assertions')

contract('Event Outwave Manager', () => {
  describe('Set and Get BaseTokenUri / behavior ', () => {
    let outwave
    let user1

    before(async () => {
      let addresses = await require('../helpers/deploy').deployUnlock('10')
      let outwaveFactory = await ethers.getContractFactory('OutwaveEvent')
      outwave = await outwaveFactory.attach(addresses.outwaveAddress)
      ;[, user1] = await ethers.getSigners()
    })
    it('shuold allow to set a BaseTokenUri', async () => {
      await outwave.setBaseTokenUri('https://uri.com/')
    })
    it('shuold get the uri', async () => {
      assert.equal(await outwave.getBaseTokenUri(), 'https://uri.com/')
    })
    it('shuold get uri from differnt user (is public)', async () => {
      assert.equal(
        await outwave.connect(user1).getBaseTokenUri(),
        'https://uri.com/'
      )
    })
  })
  describe('Set and Get BaseTokenUri / security', () => {
    let outwave
    let user1

    before(async () => {
      let addresses = await require('../helpers/deploy').deployUnlock('10')
      let outwaveFactory = await ethers.getContractFactory('OutwaveEvent')
      outwave = await outwaveFactory.attach(addresses.outwaveAddress)
      ;[, user1] = await ethers.getSigners()
    })
    it('shuold NOT allow to set a BaseTokenUri from a not owner', async () => {
      await reverts(
        outwave.connect(user1).setBaseTokenUri('https://newuri.com/'),
        'Ownable: caller is not the owner'
      )
    })
  })
})
