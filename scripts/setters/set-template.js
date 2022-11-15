const { ethers } = require('hardhat')

async function main({ publicLockAddress, unlockAddress }) {
  if (!publicLockAddress) {
    // eslint-disable-next-line no-console
    throw new Error(
      'OUTWAVE UNLOCK SET TEMPLATE > Missing template address... aborting.'
    )
  }
  if (!unlockAddress) {
    // eslint-disable-next-line no-console
    throw new Error(
      'OUTWAVE UNLOCK SET TEMPLATE > Missing Unlock address... aborting.'
    )
  }

  // get outwave unlock instance
  const unlock = await ethers.getContractAt('OutwaveUnlock', unlockAddress)
  const unlockVersion = await unlock.unlockVersion()

  // set lock template
  const publicLock = await ethers.getContractAt(
    'OutwavePublicLock',
    publicLockAddress
  )
  const publicLockversion = await publicLock.publicLockVersion()

  if (unlockVersion !== publicLockversion) {
    throw new Error(
      'OUTWAVE UNLOCK SET TEMPLATE > Unlock and template versions mismatch... aborting.'
    )
  }

  // set lock template
  const tx = await unlock.setLockTemplate(publicLockAddress)
  await tx.wait()
  // eslint-disable-next-line no-console
  // console.log(`UNLOCK SETUP> Template set for Lock (tx: ${transactionHash})`)
}

// execute as standalone
if (require.main === module) {
  /* eslint-disable promise/prefer-await-to-then, no-console */
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

module.exports = main
