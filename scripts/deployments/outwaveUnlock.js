const { ethers, upgrades } = require('hardhat')

async function main() {
  const factory = await ethers.getContractFactory('OutwaveUnlock')
  const proxy = await upgrades.deployProxy(factory)

  await proxy.deployed()

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
