const { ethers, upgrades } = require('hardhat')

async function main({ keyburnerAddress, unlockAddress }) {
  const factory = await ethers.getContractFactory('EventKeyBurner')
  const keyBurner = await upgrades.upgradeProxy(keyburnerAddress, factory, [
    unlockAddress,
  ])

  await keyBurner.deployed()

  return keyBurner.address
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
