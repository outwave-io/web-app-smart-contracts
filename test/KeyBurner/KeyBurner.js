/* eslint-disable prettier/prettier */
/* eslint-disable import/extensions */
const { ethers } = require('hardhat')
const deployer = require('../helpers/deploy')
const erc777abi = require('../helpers/ABIs/erc777.json')

const { reverts } = require('truffle-assertions')

const unlockContract = artifacts.require('Unlock.sol')
const getProxy = require('../helpers/proxy')

let keyBurner
let outwave
let locks
let outwaveLock
let unlockAddr
let outwaveAddr

contract('KeyBurner / KeyBurner', (accounts) => {
  before(async () => {
    const { outwaveAddress, unlockAddress } = await deployer.deployUnlock('10')
    unlockAddr = unlockAddress
    outwaveAddr = outwaveAddress
    const keyBurnerAddress = await deployer.deployKeyBurner({
      outwaveAddress,
      unlockAddress
    })
    let keyBurnerFactory = await ethers.getContractFactory('OutwaveKeyBurner')
    keyBurner = await keyBurnerFactory.attach(keyBurnerAddress)

    let outwaveFactory = await ethers.getContractFactory('OutwaveEvent')
    outwave = await outwaveFactory.attach(outwaveAddr)

    const unlock = await getProxy(unlockContract)
    locks = await deployer.deployLocks(unlock, accounts[0])

    const tx = await outwave
      .eventCreate(
        web3.utils.padLeft(web3.utils.asciiToHex('1'), 64),
        'name',
        web3.utils.toWei('0.0001', 'ether'),
        100000,
        1,
        'ipfs://QmdBAufFCb7ProgWvWaNkZmeLDdPLXRKF3ku5tpe99vpPx'
      )
    await tx.wait()

    let receipt = await tx.wait()
    let evt = receipt.events.find((v) => v.event === 'LockRegistered')

    let OutwaveLock = await ethers.getContractFactory('PublicLock')
    outwaveLock = await OutwaveLock.attach(evt.args.lockAddress)
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
    const burn = keyBurner.connect(keyOwner).burnKey(locks.FIRST.address, Number(evt.args.tokenId))
    await reverts(burn, 'NOT_PUBLIC_LOCK')
  })

  it('should fail on burning key without ERC721 transfer approval', async () => {
    const [, , keyOwner] = await ethers.getSigners()

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

    const burn = keyBurner.connect(keyOwner).burnKey(outwaveLock.address, Number(evt.args.tokenId))
    await reverts(burn, 'ONLY_KEY_MANAGER_OR_APPROVED')
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
    const txBurn = await keyBurner.connect(keyOwner).burnKey(outwaveLock.address, Number(tokenId))
    const txBurnRec = await txBurn.wait()
    const keyBurnEvent = txBurnRec.events.find((v) => v.event === 'KeyBurn')

    assert.equal(keyBurnEvent.args.lock, outwaveLock.address)
    assert.equal(keyBurnEvent.args.tokenId.toString(), tokenId.toString())
  })
})
