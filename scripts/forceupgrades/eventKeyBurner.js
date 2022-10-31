const { ethers, upgrades } = require('hardhat')

async function main({ keyburnerAddress }) {
  // eslint-disable-next-line no-console
  const KeyBurner = await ethers.getContractFactory('EventKeyBurner')
  const keyBurner = await upgrades.forceImport(keyburnerAddress, KeyBurner)

  await keyBurner.deployed()
  // eslint-disable-next-line no-console

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
