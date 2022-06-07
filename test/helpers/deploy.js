const { ethers, run } = require('hardhat')
const { tokens } = require('hardlydifficult-ethereum-contracts')
const deployKeyBurner = require('../../scripts/deployments/outwaveKeyburner')
const PublicLock = artifacts.require('PublicLock')
const createLockHash = require('./createLockCalldata')
const Locks = require('../fixtures/locks')

// deploys unlock and deps to enable creation of locks from Outwave Events
async function deployUnlock(unlockVersion) {
  //  let unlockVersion = '10'
  const [owner] = await ethers.getSigners()

  let unlockAddress = await run('deploy:unlock')
  let publicLockAddress = await run('deploy:template')
  let receivePaymentAddress = owner.address
  await run('set:template', {
    publicLockAddress,
    unlockAddress,
    unlockVersion,
  })

  let Outwave = await ethers.getContractFactory('OutwaveEvent')
  let outwave = await Outwave.deploy(unlockAddress, receivePaymentAddress)
  let outwaveAddress = outwave.address
  return { unlockAddress, publicLockAddress, outwaveAddress }
}

async function deployLocks(
  unlock,
  from,
  tokenAddress = web3.utils.padLeft(0, 40)
) {
  let locks = {}

  for (const name of Object.keys(Locks)) {
    const args = [
      Locks[name].expirationDuration.toFixed(),
      tokenAddress,
      Locks[name].keyPrice.toFixed(),
      Locks[name].maxNumberOfKeys.toFixed(),
      Locks[name].lockName,
    ]
    const calldata = await createLockHash({ args, from })
    const tx = await unlock.createUpgradeableLock(calldata)
    const evt = tx.logs.find((v) => v.event === 'NewLock')
    const lock = await PublicLock.at(evt.args.newLockAddress)
    locks[name] = lock
    locks[name].params = Locks[name]
  }

  return locks
}

// Deploys 2 erc20 tokens: DAI and SAI.
async function deployErc20Tokens(tokenOwner, proxyOwner) {
  let tokenDai = await tokens.dai.deploy(
    web3,
    proxyOwner.address,
    tokenOwner.address
  )
  let tokenSai = await tokens.sai.deploy(
    web3,
    proxyOwner.address,
    tokenOwner.address
  )
  return [tokenDai, tokenSai]
}

module.exports = {
  deployUnlock,
  deployKeyBurner,
  deployLocks,
  deployErc20Tokens,
}
