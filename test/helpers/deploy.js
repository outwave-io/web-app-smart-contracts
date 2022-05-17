const { ethers, run } = require('hardhat')

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
  return [unlockAddress, publicLockAddress, outwaveAddress]
}

module.exports = {
  deployUnlock,
}
