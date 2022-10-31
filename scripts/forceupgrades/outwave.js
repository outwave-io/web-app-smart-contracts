const { ethers, upgrades } = require('hardhat')

async function main({ outwaveAddress }) {
  // eslint-disable-next-line no-console
  let Outwave = await ethers.getContractFactory('OutwaveEvent')
  let outwave = await upgrades.forceImport(outwaveAddress, Outwave)

  await outwave.deployed()
  // eslint-disable-next-line no-console

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
