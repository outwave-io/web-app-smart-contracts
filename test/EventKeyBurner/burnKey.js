/* eslint-disable prettier/prettier */
/* eslint-disable import/extensions */
const { ethers } = require('hardhat')
const deployer = require('../helpers/deploy')
const erc777abi = require('../helpers/ABIs/erc777.json')

const { reverts } = require('truffle-assertions')

const unlockContract = artifacts.require('Unlock.sol')
const getProxy = require('../helpers/proxy')
const { assert } = require('chai')

contract('KeyBurner', (accounts) => {
  describe('burn key / behaviour', () => {
    let keyBurner
    let outwave
    let outwaveLock
    let unlockAddr
    let outwaveAddr
    let eventHash
    const baseTokenUri = 'https://uri.com/'
    let mintedTokenId

    before(async () => {
      const { outwaveAddress, unlockAddress } = await deployer.deployUnlock('10')
      unlockAddr = unlockAddress
      outwaveAddr = outwaveAddress
      const keyBurnerAddress = await deployer.deployKeyBurner({
        outwaveAddress,
        unlockAddress
      })
      let keyBurnerFactory = await ethers.getContractFactory('EventKeyBurner')
      keyBurner = await keyBurnerFactory.attach(keyBurnerAddress)

      let outwaveFactory = await ethers.getContractFactory('OutwaveEvent')
      outwave = await outwaveFactory.attach(outwaveAddr)
      await outwave.setBaseTokenUri(baseTokenUri)

      const tx = await outwave
        .eventCreate(
          web3.utils.padLeft(web3.utils.asciiToHex('1'), 64),
          'name',
          web3.utils.padLeft(0, 40), // address(0) 
          web3.utils.toWei('0.0001', 'ether'),
          100000,
          'ipfs://QmdBAufFCb7ProgWvWaNkZmeLDdPLXRKF3ku5tpe99vpPx',
          web3.utils.padLeft(web3.utils.asciiToHex('2'), 64)
        )
      await tx.wait()

      let receipt = await tx.wait()
      let evt = receipt.events.find((v) => v.event === 'LockRegistered')

      let OutwaveLock = await ethers.getContractFactory('PublicLock')
      outwaveLock = await OutwaveLock.attach(evt.args.lockAddress)
      eventHash = evt.args.eventId
    })

    it('should have created KeyBurner with the correct values', async () => {
      let [
        unlockRes,
        outwaveRes,
        totalSupply,
      ] = await Promise.all([
        keyBurner.readUnlock.call(),
        keyBurner.readOutwave.call(),
        keyBurner.totalSupply.call(),
      ])
      assert.equal(unlockRes, unlockAddr)
      assert.equal(outwaveRes, outwaveAddr)
      assert.equal(totalSupply.toString(), 0)
    })

    it('should burn a key', async () => {
      const [, , , keyOwner] = await ethers.getSigners()

      const txPurchase = await outwaveLock
        .purchase(
          [],
          [keyOwner.address],
          [web3.utils.padLeft(0, 40)],
          [web3.utils.padLeft(0, 40)],
          [[]],
          {
            value: web3.utils.toWei('0.0001', 'ether'),
          }
        )

      const receipt = await txPurchase.wait()

      const evt = receipt.events.find((v) => v.event === 'Transfer')
      const tokenId = evt.args.tokenId
      await outwaveLock.connect(keyOwner).approve(keyBurner.address, tokenId)

      const txBurn = await keyBurner.connect(keyOwner).burnKey(outwaveLock.address, Number(tokenId), eventHash)
      const txBurnRec = await txBurn.wait()
      const keyBurnEvent = txBurnRec.events.find((v) => v.event === 'KeyBurn')

      assert.equal(keyBurnEvent.args.lock, outwaveLock.address)
      assert.equal(keyBurnEvent.args.burnedTokenId.toString(), tokenId.toString())
      assert(keyBurnEvent.args.newTokenId)
      mintedTokenId = keyBurnEvent.args.newTokenId

    })
    it('should keyburner implement erc721 and return correct tokenuri, returning a valid name', async () => {
      let [, user1] = await ethers.getSigners()
      const erc721 = new ethers.Contract(
        keyBurner.address,
        [
          'function tokenURI(uint256 tokenId) public view returns (string memory)',
        ],
        user1
      )
      let uri = await erc721.tokenURI(mintedTokenId)
      assert.equal(
        uri.toLowerCase(),
        (baseTokenUri + outwaveLock.address + '/burned').toLowerCase()
      )
    })
  })

  describe('burn key / security', () => {
    let keyBurner
    let outwave
    let locks
    let outwaveLock1
    let outwaveLock2
    let outwaveAddr
    let eventHash1

    before(async () => {
      const { outwaveAddress, unlockAddress } = await deployer.deployUnlock('10')
      outwaveAddr = outwaveAddress
      const keyBurnerAddress = await deployer.deployKeyBurner({
        outwaveAddress,
        unlockAddress
      })
      let keyBurnerFactory = await ethers.getContractFactory('EventKeyBurner')
      keyBurner = await keyBurnerFactory.attach(keyBurnerAddress)

      let outwaveFactory = await ethers.getContractFactory('OutwaveEvent')
      outwave = await outwaveFactory.attach(outwaveAddr)

      const unlock = await getProxy(unlockContract)
      locks = await deployer.deployLocks(unlock, accounts[0])

      const tx1 = await outwave
        .eventCreate(
          web3.utils.padLeft(web3.utils.asciiToHex('1'), 64),
          'name',
          web3.utils.padLeft(0, 40), // address(0) 
          web3.utils.toWei('0.0001', 'ether'),
          100000,
          'ipfs://QmdBAufFCb7ProgWvWaNkZmeLDdPLXRKF3ku5tpe99vpPx',
          web3.utils.padLeft(web3.utils.asciiToHex('2'), 64)

        )
      await tx1.wait()

      let receipt1 = await tx1.wait()
      let evt1 = receipt1.events.find((v) => v.event === 'LockRegistered')

      let OutwaveLock1 = await ethers.getContractFactory('PublicLock')
      outwaveLock1 = await OutwaveLock1.attach(evt1.args.lockAddress)
      eventHash1 = evt1.args.eventId

      const [, event2Signer] = await ethers.getSigners()
      const tx2 = await outwave
        .connect(event2Signer)
        .eventCreate(
          web3.utils.padLeft(web3.utils.asciiToHex('2'), 64),
          'name',
          web3.utils.padLeft(0, 40), // address(0) 
          web3.utils.toWei('0.0001', 'ether'),
          100000,
          'ipfs://QmdBAufFCb7ProgWvWaNkZmeLDdPLXRKF3ku5tpe99vpPx',
          web3.utils.padLeft(web3.utils.asciiToHex('3'), 64)
        )
      await tx2.wait()

      let receipt2 = await tx2.wait()
      let evt2 = receipt2.events.find((v) => v.event === 'LockRegistered')
      let OutwaveLock2 = await ethers.getContractFactory('PublicLock')
      outwaveLock2 = await OutwaveLock2.attach(evt2.args.lockAddress)
    })

    it('should fail on unknown calls', async () => {
      const [, recipient] = accounts
      const mock777 = await ethers.getContractAt(erc777abi, keyBurner.address)
      await reverts(mock777.send(recipient, 1, '0x'))
    })

    it('should fail on burning key from unknown lock', async () => {
      const [, keyOwner] = await ethers.getSigners()

      const txPurchase = await locks.FIRST
        .purchase(
          [],
          [keyOwner.address],
          [web3.utils.padLeft(0, 40)],
          [web3.utils.padLeft(0, 40)],
          [[]],
          {
            value: web3.utils.toWei('0.0001', 'ether'),
          }
        )

      const evt = txPurchase.logs.find((v) => v.event === 'Transfer')
      const burn = keyBurner.connect(keyOwner).burnKey(locks.FIRST.address, Number(evt.args.tokenId), eventHash1)
      await reverts(burn, 'NOT_PUBLIC_LOCK')
    })

    it('should fail on burning key without ERC721 transfer approval', async () => {
      const [, , keyOwner] = await ethers.getSigners()

      const txPurchase = await outwaveLock1
        .purchase(
          [],
          [keyOwner.address],
          [web3.utils.padLeft(0, 40)],
          [web3.utils.padLeft(0, 40)],
          [[]],
          {
            value: web3.utils.toWei('0.0001', 'ether'),
          }
        )

      const receipt = await txPurchase.wait()

      const evt = receipt.events.find((v) => v.event === 'Transfer')

      const burn = keyBurner.connect(keyOwner).burnKey(outwaveLock1.address, Number(evt.args.tokenId), eventHash1)
      await reverts(burn, 'ONLY_KEY_MANAGER_OR_APPROVED')
    })

    it('should fail on burning key passing a mismatched event', async () => {
      const [, , keyOwner] = await ethers.getSigners()

      const txPurchase = await outwaveLock2
        .purchase(
          [],
          [keyOwner.address],
          [web3.utils.padLeft(0, 40)],
          [web3.utils.padLeft(0, 40)],
          [[]],
          {
            value: web3.utils.toWei('0.0001', 'ether'),
          }
        )
      const receipt = await txPurchase.wait()

      const evt = receipt.events.find((v) => v.event === 'Transfer')
      const tokenId = evt.args.tokenId
      await outwaveLock2.connect(keyOwner).approve(keyBurner.address, tokenId)

      const burn = keyBurner.connect(keyOwner).burnKey(outwaveLock2.address, Number(evt.args.tokenId), eventHash1)
      await reverts(burn, 'EVENT_LOCK_MISMATCH')
    })
  })

  describe('burn key / stress', () => {
    let keyBurner
    let outwave
    let outwaveLocks = []
    let outwaveAddr

    before(async () => {
      const { outwaveAddress, unlockAddress } = await deployer.deployUnlock('10')
      outwaveAddr = outwaveAddress
      const keyBurnerAddress = await deployer.deployKeyBurner({
        outwaveAddress,
        unlockAddress
      })
      let keyBurnerFactory = await ethers.getContractFactory('EventKeyBurner')
      keyBurner = await keyBurnerFactory.attach(keyBurnerAddress)

      let outwaveFactory = await ethers.getContractFactory('OutwaveEvent')
      outwave = await outwaveFactory.attach(outwaveAddr)

      const signers = await ethers.getSigners()
      for (let index = 0; index < signers.length; index++) {
        const account = signers[index]

        // const prov = ethers.provider
        // const balance = await prov.getBalance(account.address)
        // console.log('\naccount balance: ' + balance)

        const eventHash = web3.utils.padLeft(Math.trunc(Math.random() * 10000000), 64)
        const contractHash = web3.utils.padLeft(Math.trunc(Math.random() * 10000000), 64)

        const tx = await outwave
          .connect(account)
          .eventCreate(
            eventHash,
            'name',
            web3.utils.padLeft(0, 40), // address(0) 
            web3.utils.toWei('0.0001', 'ether'),
            100000,
            'ipfs://QmdBAufFCb7ProgWvWaNkZmeLDdPLXRKF3ku5tpe99vpPx',
            contractHash
          )

        await tx.wait()

        let receipt = await tx.wait()
        let evt = receipt.events.find((v) => v.event === 'LockRegistered')

        let OutwaveLock = await ethers.getContractFactory('PublicLock')
        let outwaveLock = await OutwaveLock.attach(evt.args.lockAddress)
        outwaveLocks.push({ lock: outwaveLock, eventHash: evt.args.eventId })
      }
    })

    it('should have created a lot of events', async () => {
      assert.equal(outwaveLocks.length, accounts.length)
    })

    it('should burn multiple keys', async () => {
      const [keyOwner] = await ethers.getSigners()

      await outwaveLocks.forEach(async ({ lock, eventHash }) => {

        const txPurchase = await lock
          .purchase(
            [],
            [keyOwner.address],
            [web3.utils.padLeft(0, 40)],
            [web3.utils.padLeft(0, 40)],
            [[]],
            {
              value: web3.utils.toWei('0.0001', 'ether'),
            }
          )

        const receipt = await txPurchase.wait()

        const evt = receipt.events.find((v) => v.event === 'Transfer')
        const tokenId = evt.args.tokenId
        await lock.connect(keyOwner).approve(keyBurner.address, tokenId)
        const txBurn = await keyBurner.connect(keyOwner).burnKey(lock.address, Number(tokenId), eventHash)
        const txBurnRec = await txBurn.wait()
        const keyBurnEvent = txBurnRec.events.find((v) => v.event === 'KeyBurn')
        assert.equal(keyBurnEvent.args.lock, lock.address)
        assert.equal(keyBurnEvent.args.burnedTokenId.toString(), tokenId.toString())
      })
    })
  })
})
