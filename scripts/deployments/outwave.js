const { ethers, upgrades } = require('hardhat')

async function main({ unlockAddress, paymentAddress }) {
  console.log(" ---> deployerparam unlockaddress: "+ unlockAddress)
  console.log(" ---> deployerparam paymentaddress: "+ paymentAddress)

  let Outwave = await ethers.getContractFactory('OutwaveEvent')
  let outwave = await upgrades.deployProxy(Outwave, [
    unlockAddress,
    paymentAddress,
  ])

  await outwave.deployed()
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
