contract('OutwaveEvent', () => {
  let unlockAddress
  let publicLockAddress
  let outwaveAddress

  beforeEach(async () => {
    ;[unlockAddress, publicLockAddress, outwaveAddress] =
      await require('./helpers/deploy').deployUnlock('10')
  })

  it('Should forbid non-managers to upgrade', async () => {
    console.log(unlockAddress)
    console.log(publicLockAddress)
    console.log(outwaveAddress)
  })
})
