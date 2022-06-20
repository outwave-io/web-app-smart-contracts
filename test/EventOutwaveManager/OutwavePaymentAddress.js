const { assert } = require('chai')
const { ethers } = require('hardhat')
const { reverts } = require('truffle-assertions')

contract('Event Outwave Manager', () => {
  describe('Set and Get OutwavePaymentAddress / behavior ', () => {
    let outwave
    let user1
    let user2
    let user3
    let randomWallet = ethers.Wallet.createRandom()

    before(async () => {
      let addresses = await require('../helpers/deploy').deployUnlock('10')
      let outwaveFactory = await ethers.getContractFactory('OutwaveEvent')
      outwave = await outwaveFactory.attach(addresses.outwaveAddress)
      ;[, user1, user2, user3] = await ethers.getSigners()
    })
    it('shuold allow to set a OutwavePaymentAddress address', async () => {
      await outwave.updateOutwavePaymentAddress(randomWallet.address)
    })
    it('shuold get the address', async () => {
      assert.equal(
        await outwave.getOutwavePaymentAddress(),
        randomWallet.address
      )
    })
    it('shuold get the address from differnt user (is public)', async () => {
      assert.equal(
        await outwave.connect(user1).getOutwavePaymentAddress(),
        randomWallet.address
      )
    })
    it('shuold receive payments', async () => {
      assert.equal(await web3.eth.getBalance(randomWallet.address), 0)

      const keyPrice = web3.utils.toWei('0.01', 'ether')
      const tx = await outwave.connect(user2).eventCreate(
        web3.utils.padLeft(web3.utils.asciiToHex('1'), 64),
        'name',
        web3.utils.padLeft(0, 40), // address(0),
        keyPrice,
        10, // num keys
        'ipfs://QmdBAufFCb7ProgWvWaNkZmeLDdPLXRKF3ku5tpe99vpPx',
        web3.utils.padLeft(web3.utils.asciiToHex('2'), 64)
      )
      let receipt = await tx.wait()
      let evt = receipt.events.find((v) => v.event === 'LockRegistered')
      let lockAddress = evt.args.lockAddress

      let readlock = await ethers.getContractAt('IEventLock', lockAddress)

      await readlock
        .connect(user3)
        .purchase(
          [keyPrice],
          [user2.address],
          [web3.utils.padLeft(0, 40)],
          [web3.utils.padLeft(0, 40)],
          [[]],
          {
            value: keyPrice,
          }
        )
      assert.isAbove(
        parseInt(await web3.eth.getBalance(randomWallet.address)),
        0
      )
    })

    it('shuold allow to change OutwavePaymentAddress address', async () => {
      let newWalletAddress = ethers.Wallet.createRandom()
      await outwave.updateOutwavePaymentAddress(newWalletAddress.address)
      assert.equal(
        await outwave.getOutwavePaymentAddress(),
        newWalletAddress.address
      )
    })
  })
  describe('disable event lock / security', () => {
    let outwave
    let user1
    let randomWallet = ethers.Wallet.createRandom()

    before(async () => {
      let addresses = await require('../helpers/deploy').deployUnlock('10')
      let outwaveFactory = await ethers.getContractFactory('OutwaveEvent')
      outwave = await outwaveFactory.attach(addresses.outwaveAddress)
      ;[, user1] = await ethers.getSigners()
    })
    it('shuold NOT allow to set a OutwavePaymentAddress address from a not owner', async () => {
      await reverts(
        outwave
          .connect(user1)
          .updateOutwavePaymentAddress(randomWallet.address),
        'Ownable: caller is not the owner'
      )
    })
  })
})
