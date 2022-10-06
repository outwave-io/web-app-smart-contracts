const { ethers, upgrades } = require('hardhat')

async function main({ outwaveAddress, unlockAddress, paymentAddress }) {
  // eslint-disable-next-line no-console
  // console.log('KEYBURNER DEPLOY > creating a new keyBurner...')

  let Outwave = await ethers.getContractFactory('OutwaveEvent')
  let outwave = await upgrades.upgradeProxy(outwaveAddress, Outwave, [
    unlockAddress,
    paymentAddress,
  ])

  await outwave.deployed()

  // eslint-disable-next-line no-console
  // console.log(
  //   `KEYBURNER DEPLOY > deployed to: ${keyBurner.address} (tx: ${keyBurner.deployTransaction.hash})`
  // )

  return outwave.address
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
