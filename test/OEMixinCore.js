const { ethers, run } = require('hardhat')

contract('OutwaveEvent', () => {
  let unlockAddress
  let publicLockAddress
  let outwaveAddress

  beforeEach(async () => {
    let unlockVersion = '10'
    const [owner] = await ethers.getSigners()

    unlockAddress = await run('deploy:unlock')
    publicLockAddress = await run('deploy:template')
    let receivePaymentAddress = owner.address
    await run('set:template', {
      publicLockAddress,
      unlockAddress,
      unlockVersion,
    })

    let Outwave = await ethers.getContractFactory('OutwaveEvent')
    let outwave = await Outwave.deploy(unlockAddress, receivePaymentAddress)
    outwaveAddress = outwave.address
  })

  it('Should forbid non-managers to upgrade', async () => {
    console.log(outwaveAddress)
  })
})
