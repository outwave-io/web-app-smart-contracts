const { assert } = require('chai')
const { ethers } = require('hardhat')
const { reverts } = require('truffle-assertions')

contract('Event Outwave Manager', () => {
  describe('Set and Get Erc20PaymentToken / behavior ', () => {
    let outwave
    let tokenDai
    let tokenSai

    before(async () => {
      let addresses = await require('../helpers/deploy').deployUnlock('10')
      let outwaveFactory = await ethers.getContractFactory('OutwaveEvent')
      outwave = await outwaveFactory.attach(addresses.outwaveAddress)
      let [, proxyOwner, tokenOwner] = await ethers.getSigners()
      ;[tokenDai, tokenSai] =
        await require('../helpers/deploy').deployErc20Tokens(
          tokenOwner,
          proxyOwner
        )
    })
    it('shuold allow to set a valid ERC20 DAI token', async () => {
      await outwave.erc20PaymentTokenAdd(tokenDai.address)
    })
    it('shuold allow to set a valid ERC20 SAI token', async () => {
      await outwave.erc20PaymentTokenAdd(tokenSai.address)
    })
    it('shuold allow to check if ERC20 DAI is configured', async () => {
      assert.isTrue(await outwave.erc20PaymentTokenIsAllowed(tokenDai.address))
    })
    it('shuold allow to check if ERC20 SAI is configured', async () => {
      assert.isTrue(await outwave.erc20PaymentTokenIsAllowed(tokenSai.address))
    })
    it('shuold remove ERC20 DAI ', async () => {
      await outwave.erc20PaymentTokenRemove(tokenDai.address)
    })
    it('shuold remove ERC20 SAI ', async () => {
      await outwave.erc20PaymentTokenRemove(tokenSai.address)
    })
    it('shuold ensure ERC20 DAI has been removed', async () => {
      assert.isFalse(await outwave.erc20PaymentTokenIsAllowed(tokenDai.address))
    })
    it('shuold ensure ERC20 SAI has been removed', async () => {
      assert.isFalse(await outwave.erc20PaymentTokenIsAllowed(tokenSai.address))
    })
  })
  describe('disable event lock / security', () => {
    let outwave
    let tokenDai
    let tokenSai
    let owner
    let proxyOwner
    let tokenOwner
    let user
    before(async () => {
      let addresses = await require('../helpers/deploy').deployUnlock('10')
      let outwaveFactory = await ethers.getContractFactory('OutwaveEvent')
      outwave = await outwaveFactory.attach(addresses.outwaveAddress)
      ;[owner, proxyOwner, tokenOwner, user] = await ethers.getSigners()
      ;[tokenDai, tokenSai] =
        await require('../helpers/deploy').deployErc20Tokens(
          tokenOwner,
          proxyOwner
        )
    })
    it('shuold  allow to set a ERC20 DAI token to a owner', async () => {
      await outwave.connect(owner).erc20PaymentTokenAdd(tokenDai.address)
    })
    it('shuold not allow to set a ERC20 SAI token to a not owner', async () => {
      await reverts(
        outwave.connect(user).erc20PaymentTokenAdd(tokenSai.address),
        'Ownable: caller is not the owner'
      )
    })
    it('shuold not allow to remove an ERC20 DAI token to a not owner', async () => {
      await reverts(
        outwave.connect(user).erc20PaymentTokenRemove(tokenDai.address),
        'Ownable: caller is not the owner'
      )
    })
    it('shuold ensure ERC20 DAI has NOT been removed', async () => {
      assert.isTrue(await outwave.erc20PaymentTokenIsAllowed(tokenDai.address))
    })
  })
})
