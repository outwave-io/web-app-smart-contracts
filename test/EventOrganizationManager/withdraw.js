const { assert } = require('chai')
const { ethers, web3 } = require('hardhat')
const { reverts } = require('truffle-assertions')

const keyPrice = web3.utils.toWei('0.01', 'ether')

contract('Organization Event Manager', () => {

  describe(`withdraw native tokens / behavior `, () => {
    let outwave
    let lockAddress
    let eventOwner
    let publiclock
    let user2
    let user3
    let eventId = web3.utils.padLeft(web3.utils.asciiToHex('1'), 64);

    before(async () => {
      let addresses = await require('../helpers/deploy').deployUnlock('10')
      let outwaveFactory = await ethers.getContractFactory('OutwaveEvent')
      outwave = await outwaveFactory.attach(addresses.outwaveAddress)
        ;[owner, proxyOwner, eventOwner, user2, user3] = await ethers.getSigners()

      const tx = await outwave
        .connect(eventOwner)
        .eventCreate(
          eventId,
          'name',
          web3.utils.padLeft(0, 40), //address(0),
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
      let PublicLock = await ethers.getContractFactory('PublicLock')
      publiclock = await PublicLock.attach(lockAddress)

    })

    it('should allow user (user2) to actually purchase in native token', async () => {

      await publiclock.connect(user2).purchase(
        [keyPrice],
        [user2.address],
        [web3.utils.padLeft(0, 40)],
        [web3.utils.padLeft(0, 40)],
        [[]],
        {
          value: keyPrice
        }
      )
      assert.isAbove(parseInt(await web3.eth.getBalance(lockAddress)), 0)
      assert.isBelow(parseInt(await web3.eth.getBalance(lockAddress)), parseInt(keyPrice))

    })

    it('shuold NOT allow withdraw to user that is not event owner (user3)', async () => {
      await reverts(
        publiclock.connect(user3).withdraw(web3.utils.padLeft(0, 40), 0), //eth, withdraw al
        'ONLY_LOCK_MANAGER_OR_BENEFICIARY'
      )
    })

    it('shuold allow event owner withdraw', async () => {
      const initialBalance = ethers.BigNumber.from(await web3.eth.getBalance(eventOwner.address))
      await outwave.connect(eventOwner).withdraw(lockAddress, await web3.eth.getBalance(lockAddress)) //eth, withdraw al
      const afterWithDrawBalance = ethers.BigNumber.from(await web3.eth.getBalance(eventOwner.address))
      assert.equal(await web3.eth.getBalance(lockAddress), 0)
      assert.isTrue(afterWithDrawBalance.gt(initialBalance))
    })

    it('shuold lock have balance 0', async () => {
      assert.isTrue(await web3.eth.getBalance(lockAddress) == 0)
    })

    it('shuold outwave contract have balance 0 (not storing on contract, but only on specified address)', async () => {
      assert.isTrue(await web3.eth.getBalance(outwave.address) == 0)
    })

  })

  describe(`withdraw ERC20 tokens / behavior `, () => {
    let outwave
    let lockAddress
    let eventOwner
    let publiclock
    let user2
    let user3
    let eventId = web3.utils.padLeft(web3.utils.asciiToHex('1'), 64);

    before(async () => {
      let addresses = await require('../helpers/deploy').deployUnlock('10')
      let outwaveFactory = await ethers.getContractFactory('OutwaveEvent')
      outwave = await outwaveFactory.attach(addresses.outwaveAddress)
        ;[owner, proxyOwner, eventOwner, user2, user3] = await ethers.getSigners()
        ;[tokenDai] =
          await require('../helpers/deploy').deployErc20Tokens(
            owner,
            proxyOwner
          )
      await outwave.erc20PaymentTokenAdd(tokenDai.address) //allow the erc20 
      await tokenDai.mint(user2.address, keyPrice, { from: owner.address });

      const tx = await outwave
        .connect(eventOwner)
        .eventCreate(
          eventId,
          'name',
          tokenDai.address,
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

      publiclock = await ethers.getContractAt('IEventLock', lockAddress)

      await tokenDai.approve(lockAddress, keyPrice, {
        from: user2.address,
      })

      balance = await tokenDai.balanceOf(user2.address);
      assert.equal(balance.toString(), keyPrice);
    })

    it('should allow user (user2) to actually purchase in ERC20 token', async () => {

      await publiclock.connect(user2).purchase(
        [keyPrice],
        [user2.address],
        [web3.utils.padLeft(0, 40)],
        [web3.utils.padLeft(0, 40)],
        [[]]
      )
      assert.isAbove(parseInt(await tokenDai.balanceOf(lockAddress)), 0)
      assert.isBelow(parseInt(await tokenDai.balanceOf(lockAddress)), parseInt(keyPrice))
    })

    it('shuold NOT allow withdraw to user that is not event owner (user3)', async () => {
      await reverts(
        outwave.connect(user3).withdraw(lockAddress, 1), //erc20, withdraw al
        'USER_NOT_LOCK_OWNER'
      )
    })

    it('shuold allow event owner withdraw and should have balance', async () => {
      const initialBalance = await tokenDai.balanceOf(eventOwner.address)
      await outwave.connect(eventOwner).withdraw(lockAddress, (await tokenDai.balanceOf(lockAddress)).toString())
      const afterWithDrawBalance = await tokenDai.balanceOf(eventOwner.address)
      assert.equal(await tokenDai.balanceOf(lockAddress), 0)
      assert.isTrue(afterWithDrawBalance.gt(initialBalance))
    })

    it('shuold lock have balance 0', async () => {
      assert.isTrue(await tokenDai.balanceOf(lockAddress) == 0)
    })

    it('shuold outwave contract have balance 0 (not storing on contract, but only on specified address)', async () => {
      assert.isTrue(await tokenDai.balanceOf(outwave.address) == 0)
    })
  })

  describe(`withdraw  / security `, () => {
    let outwave
    let lockAddress
    let eventOwner
    let publiclock
    let user2
    let user3
    let eventId = web3.utils.padLeft(web3.utils.asciiToHex('1'), 64);

    before(async () => {
      let addresses = await require('../helpers/deploy').deployUnlock('10')
      let outwaveFactory = await ethers.getContractFactory('OutwaveEvent')
      outwave = await outwaveFactory.attach(addresses.outwaveAddress)
        ;[owner, proxyOwner, eventOwner, user2, user3] = await ethers.getSigners()

      const tx = await outwave
        .connect(eventOwner)
        .eventCreate(
          eventId,
          'name',
          web3.utils.padLeft(0, 40), //address(0),
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
      let PublicLock = await ethers.getContractFactory('PublicLock')
      publiclock = await PublicLock.attach(lockAddress)

      await publiclock.connect(user2).purchase(
        [keyPrice],
        [user2.address],
        [web3.utils.padLeft(0, 40)],
        [web3.utils.padLeft(0, 40)],
        [[]],
        {
          value: keyPrice
        }
      )

    })

    it('shuold NOT allow withdraw to owner directly from public lock', async () => {
      await reverts(
        publiclock.connect(eventOwner).withdraw(web3.utils.padLeft(0, 40), 0), //eth, withdraw al
        'ONLY_LOCK_MANAGER_OR_BENEFICIARY'
      )
    })
    it('shuold NOT allow withdraw to user that is not event owner (user3)', async () => {
      await reverts(
        publiclock.connect(user3).withdraw(web3.utils.padLeft(0, 40), 0), //eth, withdraw al
        'ONLY_LOCK_MANAGER_OR_BENEFICIARY'
      )
    })
    it('shuold NOT allow withdraw to user that is not event owner (user3)', async () => {
      await reverts(
        outwave.connect(user3).withdraw(lockAddress, 1), //erc20, withdraw al
        'USER_NOT_LOCK_OWNER'
      )
    })
    it('shuold NOT allow withdraw to owner if different lock address is provided', async () => {
      await reverts(
        outwave.connect(eventOwner).withdraw(web3.utils.padLeft(0, 40), 1), //erc20, withdraw al
        'USER_NOT_LOCK_OWNER'
      )
    })

  })

})
