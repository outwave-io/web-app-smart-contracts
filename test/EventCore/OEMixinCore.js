// const { ethers, run } = require('hardhat')

contract('EventCore', () => {
  let unlockAddress
  let publicLockAddress
  let outwaveAddress

  beforeEach(async () => {
    let addresses = await require('../helpers/deploy').deployUnlock('10')
    unlockAddress = addresses.unlockAddress;
    publicLockAddress = addresses.publicLockAddress;
    outwaveAddress = addresses.outwaveAddress;
  })

  it('Should forbid non-managers to upgrade', async () => {
    // console.log(unlockAddress)
    // console.log(publicLockAddress)
    // console.log(outwaveAddress)
  })
})
