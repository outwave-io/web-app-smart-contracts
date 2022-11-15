const { ethers, upgrades } = require('hardhat')

async function main({
  unlockAddress,
  paymentAddress,
  // baseTokenURI
}) {
  const factory = await ethers.getContractFactory('OutwaveUnlock')
  const outwave = await upgrades.upgradeProxy(unlockAddress, factory, [
    unlockAddress,
    paymentAddress,
  ])

  await outwave.deployed()

  // if (baseTokenURI) {
  //   await outwave.setBaseTokenUri(basetokenuri)
  //   console.log(
  //     '- eventmanager:setBaseTokenUri has been set to: ' + basetokenuri
  //   )
  // }

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
