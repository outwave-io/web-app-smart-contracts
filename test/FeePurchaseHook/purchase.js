const { assert } = require('chai')
const { ethers, web3 } = require('hardhat')



const keyPrice = web3.utils.toWei('0.01', 'ether')

contract('OutwaveEvent', () => {

  describe(`purchase NFT with native tokens / behavior `, () => {
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
          web3.utils.padLeft(0, 40), //address(0),
          keyPrice, 
          10, // num keys
          'ipfs://QmdBAufFCb7ProgWvWaNkZmeLDdPLXRKF3ku5tpe99vpPx'
        )
        let receipt = await tx.wait()
        // verify events
        let evt = receipt.events.find((v) => v.event === 'LockRegistered')
        lockAddress = evt.args.lockAddress
        assert(lockAddress)
    })


    it('should create an actual Public Lock using native token, returning the correct tokenAddress', async () => {
      let PublicLock = await ethers.getContractFactory('PublicLock')
      publiclock = await PublicLock.attach(lockAddress)
      assert.equal(await publiclock.tokenAddress(),  web3.utils.padLeft(0, 40))
    })

    it('should create an smart contract implementing ILockManager, returnig the correct tokenAddress', async () => {
      let readlock = await ethers.getContractAt('ILockManager', lockAddress)
      assert.equal(await readlock.tokenAddress(),  web3.utils.padLeft(0, 40))
    })

    it('should lock have 0 native token Balance', async () => {
      assert.equal(await web3.eth.getBalance(publiclock.address),  0);
    })

    it('should dao have some native token', async () => {
      assert.equal(await web3.eth.getBalance(randomWallet.address),  0);
    })

    it('should allow user (user2) to actually purchase in native token', async () => {

      let txr3 = await publiclock.connect(user2).purchase(
        [keyPrice],
        [user2.address],
        [web3.utils.padLeft(0, 40)],
        [web3.utils.padLeft(0, 40)],
        [[]],
        {
          value : keyPrice
        }
      )

      const receipt = await txr3.wait()
      const evt = receipt.events.find((v) => v.event === 'Transfer')
      const tokenId = evt.args.tokenId
      assert(tokenId)
    })

    it('lock should have balance', async () => {
      assert.isAbove(parseInt(await  web3.eth.getBalance(publiclock.address)), 0)
      assert.isBelow(parseInt(await  web3.eth.getBalance(publiclock.address)), parseInt(keyPrice))
    })
    it('dao should have balance', async () => {
      assert.isAbove(parseInt(await  web3.eth.getBalance(randomWallet.address)), 0)
      assert.isBelow(parseInt(await  web3.eth.getBalance(randomWallet.address)), parseInt(keyPrice))
    })
    it('should user have valid keys', async () => {
      assert.isTrue(await publiclock.getHasValidKey(user2.address))
      assert.equal(await await publiclock.balanceOf(user2.address), 1)
    })
  })

  describe(`purchase NFT with ERC20 tokens / behavior `, () => {
    let outwave
    let lockAddress
    let owner
    let user1
    let proxyOwner
    let publiclock
    let daoUser
    let tokenDai

    before(async () => {
      let addresses = await require('../helpers/deploy').deployUnlock('10')
      let outwaveFactory = await ethers.getContractFactory('OutwaveEvent')
      outwave = await outwaveFactory.attach(addresses.outwaveAddress)
      ;[owner, proxyOwner, user1, user2, daoUser] = await ethers.getSigners()
      ;[tokenDai] =
        await require('../helpers/deploy').deployErc20Tokens(
          owner,
          proxyOwner
        )
        await outwave.erc20PaymentTokenAdd(tokenDai.address) //allow the erc20 
        await outwave.updateOutwavePaymentAddress(daoUser.address) //set dao payment address

        await tokenDai.mint(user2.address, keyPrice , { from: owner.address });

        const tx = await outwave
        .connect(user1)
        .eventCreate(
          web3.utils.padLeft(web3.utils.asciiToHex('1'), 64),
          'name',
          tokenDai.address,
          keyPrice, 
          10, // num keys
          'ipfs://QmdBAufFCb7ProgWvWaNkZmeLDdPLXRKF3ku5tpe99vpPx'
        )
        let receipt = await tx.wait()
        // verify events
        let evt = receipt.events.find((v) => v.event === 'LockRegistered')
        lockAddress = evt.args.lockAddress
        assert(lockAddress)

        await tokenDai.approve(lockAddress, keyPrice, {
          from: user2.address,
        })

        balance = await tokenDai.balanceOf(user2.address);
        assert.equal(balance.toString(),  keyPrice);
    })


    it('should create an actual Public Lock using ERC20, returning the correct tokenAddress', async () => {
      let PublicLock = await ethers.getContractFactory('PublicLock')
      publiclock = await PublicLock.attach(lockAddress)
      assert.equal(await publiclock.tokenAddress(), tokenDai.address)
    })

    it('should create an smart contract implementing ILockManager, returnig the correct tokenAddress', async () => {
      let readlock = await ethers.getContractAt('ILockManager', lockAddress)
      assert.equal(await readlock.tokenAddress(), tokenDai.address)
    })

    it('should lock have 0 ERC20 Balance', async () => {
      assert.equal(await tokenDai.balanceOf(publiclock.address),  0);
    })

    it('should lock have 0 ERC20 Balance', async () => {
      assert.equal(await tokenDai.balanceOf(daoUser.address),  0);
    })

    it('should allow user (user2) to actually purchase in ERC20 token', async () => {
      let readlock = await ethers.getContractAt('ILockManager', lockAddress)
      assert.equal(await readlock.tokenAddress(), tokenDai.address)

      let txr3 = await publiclock.connect(user2).purchase(
        [keyPrice],
        [user2.address],
        [web3.utils.padLeft(0, 40)],
        [web3.utils.padLeft(0, 40)],
        [[]]
      )

      const receipt = await txr3.wait()
      const evt = receipt.events.find((v) => v.event === 'Transfer')
      const tokenId = evt.args.tokenId
      assert(tokenId)
    })
    it('user2 shuold not have ERC20 balance ', async () => {
      assert.equal(parseInt(await tokenDai.balanceOf(user2.address)), 0)
    })
    it('lock should have balance', async () => {
      assert.isAbove(parseInt(await tokenDai.balanceOf(publiclock.address)), 0)
      assert.isBelow(parseInt(await tokenDai.balanceOf(publiclock.address)), parseInt(keyPrice))
    })
    it('dao should have balance', async () => {
      assert.isAbove(parseInt(await tokenDai.balanceOf(daoUser.address)), 0)
      assert.isBelow(parseInt(await tokenDai.balanceOf(daoUser.address)), parseInt(keyPrice))
    })
    it('should user have valid keys', async () => {
      assert.isTrue(await publiclock.getHasValidKey(user2.address))
      assert.equal(await await publiclock.balanceOf(user2.address), 1)
    })
  })
})
