const { ethers, upgrades } = require('hardhat')

async function main({ unlockAddress }) {
  // eslint-disable-next-line no-console
  // console.log('KEYBURNER DEPLOY > creating a new keyBurner...')

  const factory = await ethers.getContractFactory('OutwaveKeyBurner')
  const proxy = await upgrades.deployProxy(factory, [unlockAddress])

  await proxy.deployed()

  // eslint-disable-next-line no-console
  // console.log(
  //   `KEYBURNER DEPLOY > deployed to: ${proxy.address} (tx: ${proxy.deployTransaction.hash})`
  // )

  return proxy.address
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
