const { assert } = require('chai')
const { ethers } = require('hardhat')
const { reverts } = require('truffle-assertions')

const keyPrice = web3.utils.toWei('0.01', 'ether')

contract('Organization Event Manager', () => {
  describe('set max keys per address / behaviour ', () => {
    let outwave
    let lockAddress
    let user1
    let publiclock
    let randomWallet = ethers.Wallet.createRandom()

    before(async () => {
      let addresses = await require('../helpers/deploy').deployUnlock('10')
      let outwaveFactory = await ethers.getContractFactory('OutwaveEvent')
      outwave = await outwaveFactory.attach(addresses.outwaveAddress)
        ;[owner, proxyOwner, user1, user2] = await ethers.getSigners()

      await outwave.updateOutwavePaymentAddress(randomWallet.address) //set dao payment address

      const tx = await outwave
        .connect(user1)
        .eventCreate(
          web3.utils.padLeft(web3.utils.asciiToHex('1'), 64),
          'name',
          web3.utils.padLeft(0, 40), // address(0),
          keyPrice,
          10, // num keys
          'ipfs://QmdBAufFCb7ProgWvWaNkZmeLDdPLXRKF3ku5tpe99vpPx',
          web3.utils.padLeft(web3.utils.asciiToHex('2'), 64)
        )
      let receipt = await tx.wait()
      // verify events
      let evt = receipt.events.find((v) => v.event === 'LockRegistered')
      lockAddress = evt.args.lockAddress
      assert(lockAddress)
    })

    it('should change PublicLock::maxKeysPerAddress', async () => {
      ;[, , lockOwner] = await ethers.getSigners()


      await outwave.connect(lockOwner).eventLockSetMaxKeysPerAddress(lockAddress, 3)

      let PublicLock = await ethers.getContractFactory('PublicLock')
      publiclock = await PublicLock.attach(lockAddress)
      assert.equal(await publiclock.maxKeysPerAddress(), 3)
    })

    it('should allow user to purchase multiple keys', async () => {
      ;[, recipient] = await ethers.getSigners()

      let PublicLock = await ethers.getContractFactory('PublicLock')
      publiclock = await PublicLock.attach(lockAddress)

      for (let index = 0; index < 3; index++) {
        let trx = await publiclock.purchase(
          [keyPrice],
          [recipient.address],
          [web3.utils.padLeft(0, 40)],
          [web3.utils.padLeft(0, 40)],
          [[]],
          {
            value: keyPrice,
          }
        )

        const receipt = await trx.wait()
        const evt = receipt.events.find((v) => v.event === 'Transfer')
        const tokenId = evt.args.tokenId
        assert(tokenId)
      }
    })
  })

  describe('set max keys per address / security ', () => {
    let outwave
    let lockAddress
    let user1
    let publiclock
    let randomWallet = ethers.Wallet.createRandom()

    before(async () => {
      let addresses = await require('../helpers/deploy').deployUnlock('10')
      let outwaveFactory = await ethers.getContractFactory('OutwaveEvent')
      outwave = await outwaveFactory.attach(addresses.outwaveAddress)
        ;[owner, proxyOwner, user1, user2] = await ethers.getSigners()

      await outwave.updateOutwavePaymentAddress(randomWallet.address) //set dao payment address

      const tx = await outwave
        .connect(user1)
        .eventCreate(
          web3.utils.padLeft(web3.utils.asciiToHex('1'), 64),
          'name',
          web3.utils.padLeft(0, 40), // address(0),
          keyPrice,
          10, // num keys
          'ipfs://QmdBAufFCb7ProgWvWaNkZmeLDdPLXRKF3ku5tpe99vpPx',
          web3.utils.padLeft(web3.utils.asciiToHex('2'), 64)
        )
      let receipt = await tx.wait()
      // verify events
      let evt = receipt.events.find((v) => v.event === 'LockRegistered')
      lockAddress = evt.args.lockAddress
      assert(lockAddress)

      await outwave
        .connect(user1)
        .eventLockSetMaxKeysPerAddress(lockAddress, 3)
    })

    it('should NOT allow user to purchase more keys than maxKeysPerAddress', async () => {
      ;[, recipient] = await ethers.getSigners()

      let PublicLock = await ethers.getContractFactory('PublicLock')
      publiclock = await PublicLock.attach(lockAddress)

      // allowed purchases
      await Promise.all([
        publiclock.purchase(
          [keyPrice],
          [recipient.address],
          [web3.utils.padLeft(0, 40)],
          [web3.utils.padLeft(0, 40)],
          [[]],
          {
            value: keyPrice,
          }
        ),
        publiclock.purchase(
          [keyPrice],
          [recipient.address],
          [web3.utils.padLeft(0, 40)],
          [web3.utils.padLeft(0, 40)],
          [[]],
          {
            value: keyPrice,
          }
        ),
        publiclock.purchase(
          [keyPrice],
          [recipient.address],
          [web3.utils.padLeft(0, 40)],
          [web3.utils.padLeft(0, 40)],
          [[]],
          {
            value: keyPrice,
          }
        ),
      ])

      const unallowedPurchase = publiclock.purchase(
        [keyPrice],
        [recipient.address],
        [web3.utils.padLeft(0, 40)],
        [web3.utils.padLeft(0, 40)],
        [[]],
        {
          value: keyPrice,
        }
      )

      await reverts(unallowedPurchase, 'MAX_KEYS')
    })
  })
})
